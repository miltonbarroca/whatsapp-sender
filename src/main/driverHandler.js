// driverHandler.js
const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const isDev = require("electron-is-dev");
const { logger } = require("./logger");
const chromedriver = require("chromedriver");

/* =========================
   SO / CHROMEDRIVER
========================= */
const isWin = process.platform === "win32";

/* =========================
   USER DATA DIR
========================= */
const userDataDir = path.join(os.homedir(), "WhatsappSenderUserData");
try {
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.chmodSync(userDataDir, 0o700); // garante leitura/escrita
    logger.info(`Criado userDataDir: ${userDataDir}`);
  } else {
    logger.info(`userDataDir já existe: ${userDataDir}`);
  }
} catch (err) {
  logger.error(`Erro ao criar userDataDir: ${err.message}`);
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
        try { execSync(`taskkill /PID ${pid} /T /F`); } catch {}
      }
    } else {
      const out = execSync(`pgrep -f "${profilePath}" || true`, { encoding: "utf8" });
      const pids = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      for (const pid of pids) {
        try { process.kill(Number(pid), "SIGKILL"); } catch {}
      }
    }
  } catch (err) {
    logger.warn(`Erro ao tentar matar processos do Chrome: ${err.message}`);
  }
}

/* =========================
   RESOLVE CHROME PATH
========================= */
function resolveChromeBinaryPath() {
  if (isDev) return undefined; // usa PATH do dev

  if (!isWin) {
    const possiblePaths = [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser"
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        logger.info(`Chrome/Chromium encontrado em: ${p}`);
        return p;
      }
    }
    throw new Error("Chrome/Chromium não encontrado em produção!");
  }

  return undefined; // Windows prod, Selenium pega do PATH
}

/* =========================
   RESOLVE CHROMEDRIVER PATH
========================= */
function resolveChromedriverPath() {
  if (isWin) return path.join(__dirname, "chromedriver.exe");
  return chromedriver.path; // npm chromedriver retorna caminho correto no Linux
}

/* =========================
   DRIVER INSTANCE
========================= */
let driver = null;

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

  if (!isWin) {
    try { execSync(`chmod +x "${chromedriverPath}"`); } catch {}
  }

  const options = new chrome.Options();
  const chromeBinary = resolveChromeBinaryPath();
  if (chromeBinary) {
    options.setChromeBinaryPath(chromeBinary);
    logger.info(`Usando Chrome binary: ${chromeBinary}`);
  }

  options.addArguments(
    `--user-data-dir=${userDataDir}`,
    "--start-maximized",
    "--remote-debugging-port=0",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions"
  );

  // se não tiver display (servidor), use headless
  if (!process.env.DISPLAY && !isWin) {
    logger.info("DISPLAY não encontrado, iniciando Chrome em headless");
    options.addArguments("--headless=new");
  } else {
    logger.info(`DISPLAY encontrado: ${process.env.DISPLAY}, Chrome visível`);
  }

  killChromeProcessesUsingProfile(userDataDir);

  const service = new chrome.ServiceBuilder(chromedriverPath)
    .loggingTo(path.join(userDataDir, "chromedriver.log"))
    .enableVerboseLogging();

  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  logger.info("Driver inicializado com sucesso.");
  return driver;
}

/* =========================
   CLOSE DRIVER
========================= */
async function closeDriver() {
  if (driver) {
    try { await driver.quit(); } catch {}
    driver = null;
    logger.info("Driver fechado.");
  }
}

module.exports = { initDriver, closeDriver };
