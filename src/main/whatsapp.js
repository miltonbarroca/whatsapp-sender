const { Builder, By, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");
const os = require("os");
const isDev = require("electron-is-dev");
require("chromedriver");
const { logMessageStatus, logger } = require("./logger");
const { execSync } = require("child_process");

/* =========================
   SO / CHROMEDRIVER
========================= */
const isWin = process.platform === "win32";
const chromedriverBinary = isWin ? "chromedriver.exe" : "chromedriver";

/* =========================
   USER DATA DIR
========================= */
const userDataDir = path.join(os.homedir(), "WhatsappSenderUserData");
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir, { recursive: true });
}

/* =========================
   KILL CHROME USING PROFILE
========================= */
function killChromeProcessesUsingProfile(profilePath) {
  try {
    if (isWin) {
      const wmicCmd = `wmic process where "name='chrome.exe' and CommandLine like '%${profilePath.replace(
        /\\/g,
        "\\\\\\"
      )}%'" get ProcessId /FORMAT:CSV`;
      const out = execSync(wmicCmd, { encoding: "utf8" });
      const pids = Array.from(out.matchAll(/,(\d+)\r?\n/g)).map(m => m[1]);
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /T /F`);
        } catch {}
      }
    } else {
      const out = execSync(`pgrep -f "${profilePath}" || true`, {
        encoding: "utf8",
      });
      const pids = out
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);
      for (const pid of pids) {
        try {
          process.kill(Number(pid), "SIGKILL");
        } catch {}
      }
    }
  } catch {}
}

/* =========================
   DRIVER
========================= */
let driver = null;

function resolveChromedriverPath() {
  if (isDev) {
    return path.join(
      process.cwd(),
      "node_modules",
      "chromedriver",
      "lib",
      "chromedriver",
      chromedriverBinary
    );
  }

  return path.join(
    process.resourcesPath,
    "drivers",
    "chromedriver",
    chromedriverBinary
  );
}

/* =========================
   INIT DRIVER
========================= */
async function initDriver() {
  if (driver) {
    try {
      await driver.getSession();
      return driver;
    } catch {
      await closeDriver();
    }
  }

  const chromedriverPath = resolveChromedriverPath();

  if (!fs.existsSync(chromedriverPath)) {
    throw new Error(`Chromedriver não encontrado: ${chromedriverPath}`);
  }

  // garante permissão no Linux
  if (!isWin) {
    try {
      execSync(`chmod +x "${chromedriverPath}"`);
    } catch {}
  }

  const options = new chrome.Options();
  options.addArguments(`--user-data-dir=${userDataDir}`);
  options.addArguments("--start-maximized");
  options.addArguments("--remote-debugging-port=0");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-gpu");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--disable-extensions");

  killChromeProcessesUsingProfile(userDataDir);

  const service = new chrome.ServiceBuilder(chromedriverPath);

  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  await driver.get("https://web.whatsapp.com");
  logger.info("Aguardando login no WhatsApp Web...");

  const timeout = 120000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      const chatList = await driver.findElements(
        By.css("div[role='grid'], div[aria-label='Chat list']")
      );
      if (chatList.length > 0) {
        logger.info("Sessão logada com sucesso!");
        return driver;
      }
    } catch {}
    await driver.sleep(5000);
  }

  logger.warn("Login não confirmado (timeout).");
  return driver;
}

/* =========================
   SEND MESSAGES
========================= */
async function sendMessages(numbers, messages, delaySeconds = 60) {
  const activeDriver = await initDriver();

  for (let i = 0; i < numbers.length; i++) {
    const number = numbers[i]?.trim();
    const message = messages[i];

    if (!number || !message) continue;

    console.log("Números recebidos:", numbers);
    console.log("Mensagens recebidas:", messages);

    try {
      const encodedMessage = encodeURIComponent(message);
      const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodedMessage}`;

      await activeDriver.get(url);
      await activeDriver.sleep(5000);

      let messageBox = null;

      for (let j = 0; j < 10; j++) {
        try {
          messageBox = await activeDriver.findElement(
            By.xpath("//div[@contenteditable='true']")
          );
          break;
        } catch {
          await activeDriver.sleep(1000);
        }
      }

      if (!messageBox) {
        throw new Error("Campo de mensagem não encontrado");
      }

      await messageBox.sendKeys(Key.ENTER);

      logger.info(`Mensagem enviada para ${number}`);
      logMessageStatus(number, true);
    } catch (err) {
      const msg = err?.message || String(err);
      logger.warn(`Erro ao enviar para ${number}: ${msg}`);
      logMessageStatus(number, false, msg);
    }

    await activeDriver.sleep(delaySeconds * 1000);
  }

  logger.info("Envio concluído!");
}

/* =========================
   CLOSE DRIVER
========================= */
async function closeDriver() {
  if (driver) {
    try {
      await driver.quit();
    } catch {}
    driver = null;
    logger.info("Driver fechado.");
  }
}

module.exports = { sendMessages, closeDriver };
