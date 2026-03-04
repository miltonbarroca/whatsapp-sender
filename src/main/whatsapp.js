const { By, Key, until } = require("selenium-webdriver");
const fs = require("fs");
const path = require("path");
const { logMessageStatus, logger } = require("./logger");
const { initDriver, closeDriver } = require("./driverHandler");

/* =========================
   DELAY UTIL
========================= */
function getDelayMs(settings) {
  const base = Math.max(60, settings?.delaySeconds ?? 60);

  if (!settings?.randomize) {
    return base * 1000;
  }

  const variation = Math.max(0, settings?.randomVariation ?? 0);

  const min = Math.max(60, base - variation);
  const max = base + variation;

  const randomSeconds =
    Math.floor(Math.random() * (max - min + 1)) + min;

  return randomSeconds * 1000;
}

function resolveMediaPath(rawPath) {
  const normalized = String(rawPath || "").trim();
  if (!normalized) return "";

  const absolutePath = path.resolve(normalized);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo de mídia não encontrado: ${absolutePath}`);
  }
  return absolutePath;
}

async function waitForChatReady(driver) {
  return driver.wait(
    until.elementLocated(By.xpath("//footer//div[@contenteditable='true']")),
    20000
  );
}

async function openChat(driver, number, prefilledText = "") {
  const encodedMessage = encodeURIComponent(prefilledText);
  const url = prefilledText
    ? `https://web.whatsapp.com/send?phone=${number}&text=${encodedMessage}`
    : `https://web.whatsapp.com/send?phone=${number}`;

  await driver.get(url);
  await waitForChatReady(driver);
}

async function sendTextFromPrefilledUrl(driver, number, message) {
  await openChat(driver, number, message);

  const messageBox = await waitForChatReady(driver);
  let hasText = false;

  for (let t = 0; t < 20; t++) {
    const text = await messageBox.getText();
    if (text && text.length > 0) {
      hasText = true;
      break;
    }
    await driver.sleep(300);
  }

  if (!hasText) {
    throw new Error("Mensagem não foi preenchida no campo");
  }

  await messageBox.click();
  await driver.sleep(250);
  await messageBox.sendKeys(Key.ENTER);
}

async function sendTextInOpenChat(driver, message) {
  const text = String(message || "").trim();
  if (!text) return;

  const messageBox = await waitForChatReady(driver);
  await messageBox.click();
  await driver.sleep(200);
  await messageBox.sendKeys(text, Key.ENTER);
}

async function pickBottomMostVisible(elements) {
  let best = null;
  let bestScore = -1;

  for (const element of elements) {
    try {
      if (!(await element.isDisplayed())) continue;
      const rect = await element.getRect();
      const score = (rect.y || 0) * 10000 + (rect.x || 0);
      if (score > bestScore) {
        bestScore = score;
        best = element;
      }
    } catch {}
  }

  return best;
}

async function findBestMediaSendButton(driver) {
  const preferred = await driver.findElements(By.xpath(
    "//button[@data-testid='compose-btn-send' and not(@disabled) and not(ancestor::footer)]" +
      " | //button[.//span[@data-icon='send'] and not(@disabled) and not(ancestor::footer)]" +
      " | //div[@role='button' and .//span[@data-icon='send'] and not(ancestor::footer)]" +
      " | //button[(@aria-label='Send' or @aria-label='Enviar') and not(@disabled) and not(ancestor::footer)]" +
      " | //div[@role='button' and (@aria-label='Send' or @aria-label='Enviar') and not(ancestor::footer)]"
  ));
  const preferredChoice = await pickBottomMostVisible(preferred);
  if (preferredChoice) return preferredChoice;

  const generic = await driver.findElements(By.xpath(
    "//button[@data-testid='compose-btn-send' and not(@disabled)]" +
      " | //button[.//span[@data-icon='send'] and not(@disabled)]" +
      " | //div[@role='button' and .//span[@data-icon='send']]" +
      " | //button[(@aria-label='Send' or @aria-label='Enviar') and not(@disabled)]" +
      " | //div[@role='button' and (@aria-label='Send' or @aria-label='Enviar')]"
  ));
  const genericChoice = await pickBottomMostVisible(generic);
  if (genericChoice) return genericChoice;

  return null;
}

async function sendMediaInOpenChat(driver, mediaFilePath, message) {
  let fileInputs = await driver.findElements(
    By.css("input[type='file'][accept*='image'][accept*='video']")
  );
  if (!fileInputs.length) {
    fileInputs = await driver.findElements(
      By.css("input[type='file'][accept*='image']")
    );
  }

  if (!fileInputs.length) {
    throw new Error("Input de upload de mídia não encontrado no WhatsApp Web.");
  }

  await fileInputs[0].sendKeys(mediaFilePath);

  await driver.wait(async () => Boolean(await findBestMediaSendButton(driver)), 25000);

  let mediaSent = false;

  // Tenta múltiplas estratégias para fechar o editor e disparar o envio.
  for (let attempt = 0; attempt < 3; attempt++) {
    const sendButton = await findBestMediaSendButton(driver);
    if (!sendButton) {
      mediaSent = true;
      break;
    }

    try {
      await sendButton.click();
    } catch {
      await driver.executeScript("arguments[0].click();", sendButton);
    }

    await driver.sleep(900);
    const stillOpenAfterClick = await findBestMediaSendButton(driver);
    if (!stillOpenAfterClick) {
      mediaSent = true;
      break;
    }
  }

  if (!mediaSent) {
    throw new Error("Não foi possível confirmar o envio do anexo no editor de mídia.");
  }

  if (String(message || "").trim()) {
    await sendTextInOpenChat(driver, message);
  }
}

/* =========================
   SEND MESSAGES
========================= */
async function sendMessages(numbers, messages, settings, options = {}) {
  const driver = await initDriver();
  const mediaPath = resolveMediaPath(options.mediaPath);

  for (let i = 0; i < numbers.length; i++) {
    const number = String(numbers[i]).trim();
    const message = String(messages[i] ?? "").trim();

    if (!number || (!message && !mediaPath)) continue;

    try {
      if (mediaPath) {
        await openChat(driver, number);
        await sendMediaInOpenChat(driver, mediaPath, message);
      } else {
        await sendTextFromPrefilledUrl(driver, number, message);
      }

      logger.info(`Mensagem enviada para ${number}`);
      logMessageStatus(number, true);
    } catch (err) {
      const msg = err?.message || String(err);
      logger.warn(`Erro ao enviar para ${number}: ${msg}`);
      logMessageStatus(number, false, msg);
    }

    const delayMs = getDelayMs(settings);
    logger.info(`Delay de ${Math.round(delayMs / 1000)}s`);
    await driver.sleep(delayMs);
  }

  logger.info("Envio concluído!");
}

module.exports = { sendMessages, closeDriver };
