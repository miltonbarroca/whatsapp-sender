const { Builder, By, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");
const os = require("os");
const isDev = require("electron-is-dev");
require("chromedriver");
const { logMessageStatus, logger } = require("./logger");

const userDataDir = path.join(os.homedir(), "WhatsappSenderUserData");
if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

let driver = null;

async function initDriver() {
  if (driver) return driver;

  const options = new chrome.Options();
  options.addArguments(`--user-data-dir=${userDataDir}`);
  options.addArguments("--start-maximized");

  let chromedriverPath;
  if (isDev) {
    chromedriverPath = path.join(
      process.cwd(),
      "node_modules",
      "chromedriver",
      "lib",
      "chromedriver",
      "chromedriver.exe"
    );
  } else {
    chromedriverPath = path.join(
      process.resourcesPath,
      "drivers",
      "chromedriver",
      "chromedriver.exe"
    );
  }

  if (!fs.existsSync(chromedriverPath)) {
    throw new Error(`chromedriver.exe não encontrado em: ${chromedriverPath}`);
  }

  const service = new chrome.ServiceBuilder(chromedriverPath);
  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  await driver.get("https://web.whatsapp.com");
  logger.info("Aguardando login no WhatsApp Web...");

  const timeout = 120000; // 2 minutos
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Verifica se o QR ainda está visível
      const qrCanvas = await driver.findElements(
        By.css("canvas[aria-label='Scan this QR code to link a device!']")
      );

      if (qrCanvas.length > 0) {
        logger.info("QR code ainda visível — aguardando escaneamento...");
      } else {
        // Verifica se a lista de conversas apareceu (indicador de login)
        const chatList = await driver.findElements(
          By.css("div[role='grid'], div[aria-label='Chat list']")
        );
        if (chatList.length > 0) {
          logger.info("Sessão logada com sucesso!");
          return driver;
        }
      }
    } catch (err) {
      logger.debug(`Verificação falhou: ${err.message}`);
    }

    await driver.sleep(5000);
  }

  logger.warn("Tempo de login expirou — QR code pode não ter sido escaneado.");
  return driver;
}

async function sendMessages(numbers, messages, delaySeconds = 60) {
  const driver = await initDriver();

  for (let i = 0; i < numbers.length; i++) {
    const number = numbers[i].trim();
    const message = messages[i];

    if (!number || !message) continue;
    try {
      const encodedMessage = encodeURIComponent(message);
      const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodedMessage}`;

      await driver.get(url);
      await driver.sleep(5000); // espera página carregar

      let messageBox = null;
      for (let j = 0; j < 10; j++) {
        try {
          messageBox = await driver.findElement(
            By.xpath("//div[@contenteditable='true' and @data-tab='10']")
          );
          break;
        } catch {
          await driver.sleep(1000);
        }
      }

      if (messageBox) {
        await messageBox.sendKeys(Key.ENTER);
        logger.info(`Mensagem enviada para ${number}`);
        logMessageStatus(number, true);
      } else {
        logger.warn(`Campo de mensagem não encontrado para ${number}`);
        logMessageStatus(number, false, 'campo de mensagem não encontrado');
      }
    } catch (err) {
      logger.error(`Erro ao enviar para ${number}: ${err && err.message ? err.message : err}`);
      logMessageStatus(number, false, err && err.message ? err.message : String(err));
    }

    await driver.sleep(delaySeconds * 1000);
  }

  console.log("Envio concluído!");
}

async function closeDriver() {
  if (driver) {
    await driver.quit();
    driver = null;
    logger.info("Driver fechado!");
  }
}

module.exports = { sendMessages, closeDriver };
