const { By, Key, until } = require("selenium-webdriver");
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

/* =========================
   SEND MESSAGES
========================= */
async function sendMessages(numbers, messages, settings) {
  const driver = await initDriver();

  for (let i = 0; i < numbers.length; i++) {
    const number = String(numbers[i]).trim();
    const message = String(messages[i] ?? "").trim();

    if (!number || !message) continue;

    try {
      const encodedMessage = encodeURIComponent(message);
      const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodedMessage}`;

      await driver.get(url);

      const messageBox = await driver.wait(
        until.elementLocated(
          By.xpath("//footer//div[@contenteditable='true']")
        ),
        20000
      );

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
      await driver.sleep(300);
      await messageBox.sendKeys(Key.ENTER);

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
