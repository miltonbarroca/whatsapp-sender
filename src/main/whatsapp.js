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

const { execSync } = require('child_process');

function killChromeProcessesUsingProfile(profilePath) {
  // Attempt to only kill Chrome processes that use the same profile dir (safer than killing all chrome)
  try {
    if (process.platform === 'win32') {
      // WMIC query to find chrome.exe processes with that profile in their command line
      const wmicCmd = `wmic process where "name='chrome.exe' and CommandLine like '%${profilePath.replace(/\\/g, '\\\\\\')}%'" get ProcessId /FORMAT:CSV`;
      const out = execSync(wmicCmd, { encoding: 'utf8' });
      const pids = Array.from(out.matchAll(/,(\d+)\r?\n/g)).map(m => m[1]);
      for (const pid of pids) {
        try { execSync(`taskkill /PID ${pid} /T /F`); } catch (e) { /* ignore */ }
      }
    } else {
      // Unix-like: pgrep -f to find processes whose command contains the profile path
      const out = execSync(`pgrep -f "${profilePath}" || true`, { encoding: 'utf8' });
      const pids = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      for (const pid of pids) {
        try { process.kill(Number(pid), 'SIGKILL'); } catch (e) { /* ignore */ }
      }
    }
  } catch (e) {
    // best-effort; ignore failures
  }
}

let driver = null;

async function initDriver() {
  // If we have an existing driver, verify the session is still valid before reusing it
  if (driver) {
    try {
      await driver.getSession();
      return driver;
    } catch (err) {
      logger.warn('Driver session invalid or closed — recreating driver.');
      await closeDriver();
    }
  }

  const options = new chrome.Options();
  // Robust flags to reduce Chrome start/crash issues
  options.addArguments(`--user-data-dir=${userDataDir}`);
  options.addArguments("--start-maximized");
  options.addArguments('--remote-debugging-port=0');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-gpu');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-extensions');

  // If a previous Chrome using the same profile is still running it can cause Chrome to crash on start — try to remove it.
  killChromeProcessesUsingProfile(userDataDir);

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
  let driver = await initDriver();

  for (let i = 0; i < numbers.length; i++) {
    const number = numbers[i].trim();
    const message = messages[i];

    if (!number || !message) continue;

    let attempts = 0;
    let sent = false;

    while (attempts < 2 && !sent) {
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

        sent = true; // success or not-found means we shouldn't retry
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        logger.warn(`Erro ao enviar para ${number}: ${msg}`);

        // If it's likely a session/Chrome crash, restart driver and retry once
        if (attempts === 0 && /DevToolsActivePort|session not created|no longer running|chrome failed|invalid session|chrome not reachable/i.test(msg)) {
          logger.info('Detected driver/session issue — restarting driver and retrying once...');
          try {
            await closeDriver();
            driver = await initDriver();
          } catch (reErr) {
            logger.error(`Falha ao reiniciar driver: ${reErr && reErr.message ? reErr.message : reErr}`);
            logMessageStatus(number, false, reErr && reErr.message ? reErr.message : String(reErr));
            sent = true;
            break;
          }
          attempts++;
          continue;
        }

        logger.error(`Erro ao enviar para ${number}: ${msg}`);
        logMessageStatus(number, false, msg);
        sent = true;
      }
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
