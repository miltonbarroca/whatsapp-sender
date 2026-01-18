// driverHandler.js
const { Builder, By, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const isDev = require("electron-is-dev");
const { logger } = require("./logger");

/* =========================
   SO / CHROMEDRIVER
========================= */
const isWin = process.platform === "win32";

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
        try { execSync(`taskkill /PID ${pid} /T /F`); } catch {}
      }
    } else {
      const out = execSync(`pgrep -f "${profilePath}" || true`, { encoding: "utf8" });
      const pids = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      for (const pid of pids) {
        try { process.kill(Number(pid), "SIGKILL"); } catch {}
      }
    }
  } catch {}
}

/* =========================
   RESOLVE CHROME PATH
========================= */
function resolveChromeBinaryPath() {
  if (isDev) return undefined; // usa PATH do dev

  if (!isWin) {
    const possiblePaths = [
      "/usr/bin/chromium",
      "/usr/bin/google-chrome-stable"
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).size > 10000) {
        logger.info(`Chrome/Chromium encontrado em: ${p}`);
        return p;
      }
    }
    throw new Error("Chrome/Chromium não encontrado em produção! Instale o Chromium ou Google Chrome.");
  }

  return undefined; // Windows prod
}

/* =========================
   RESOLVE CHROMEDRIVER PATH
========================= */
function resolveChromedriverPath() {
  if (isWin) return path.join(__dirname, "chromedriver.exe");
  return "/usr/bin/chromedriver"; // Linux usa binário do sistema
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

  const options = new chrome.Options();
  const chromeBinary = resolveChromeBinaryPath();
  if (chromeBinary) options.setChromeBinaryPath(chromeBinary);

  options.addArguments(
    `--user-data-dir=${userDataDir}`,
    "--start-maximized",
    "--remote-debugging-port=0",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--enable-logging",
    "--v=1"
  );

  // não usar headless para que o cliente veja o navegador
  // kill qualquer processo antigo que esteja usando o profile
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
