// driverHandler.js
const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const { binaryPaths } = require("selenium-webdriver/common/seleniumManager");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
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

function buildChromeOptions() {
  const options = new chrome.Options();
  options.addArguments(`--user-data-dir=${userDataDir}`);
  options.addArguments("--start-maximized");
  options.addArguments("--remote-debugging-port=0");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-gpu");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--disable-extensions");
  return options;
}

function getSeleniumManagerPlatformParts() {
  if (process.platform === "win32") {
    return { folder: "windows", binary: "selenium-manager.exe" };
  }
  if (process.platform === "darwin") {
    return { folder: "macos", binary: "selenium-manager" };
  }
  return { folder: "linux", binary: "selenium-manager" };
}

function resolvePackagedSeleniumManagerPath() {
  const resourcesPath = process.resourcesPath;
  if (!resourcesPath) return "";

  const { folder, binary } = getSeleniumManagerPlatformParts();
  const candidate = path.join(
    resourcesPath,
    "app.asar.unpacked",
    "node_modules",
    "selenium-webdriver",
    "bin",
    folder,
    binary
  );

  return fs.existsSync(candidate) ? candidate : "";
}

async function buildWithSeleniumManager(options) {
  const seleniumCacheDir = path.join(userDataDir, "selenium-cache");
  fs.mkdirSync(seleniumCacheDir, { recursive: true });

  const managerPath = resolvePackagedSeleniumManagerPath();
  const previousManagerPath = process.env.SE_MANAGER_PATH;

  if (managerPath) {
    process.env.SE_MANAGER_PATH = managerPath;
    if (!isWin) {
      try {
        execSync(`chmod +x "${managerPath}"`);
      } catch {}
    }
  }

  let resolvedPaths;
  try {
    resolvedPaths = binaryPaths([
      "--browser",
      "chrome",
      "--language-binding",
      "javascript",
      "--output",
      "json",
      "--skip-driver-in-path",
      "--cache-path",
      seleniumCacheDir,
    ]);
  } catch (err) {
    const hint = managerPath ? ` (SE_MANAGER_PATH=${managerPath})` : "";
    throw new Error(`Falha ao resolver driver com Selenium Manager${hint}: ${err?.message || err}`);
  } finally {
    if (managerPath) {
      if (previousManagerPath) {
        process.env.SE_MANAGER_PATH = previousManagerPath;
      } else {
        delete process.env.SE_MANAGER_PATH;
      }
    }
  }

  const { driverPath, browserPath } = resolvedPaths;

  if (!driverPath) {
    throw new Error("Selenium Manager não retornou driverPath.");
  }

  if (!fs.existsSync(driverPath)) {
    throw new Error(`Driver retornado pelo Selenium Manager não existe: ${driverPath}`);
  }

  if (browserPath && fs.existsSync(browserPath)) {
    options.setChromeBinaryPath(browserPath);
  }

  if (!isWin) {
    try {
      execSync(`chmod +x "${driverPath}"`);
    } catch {}
  }

  const service = new chrome.ServiceBuilder(driverPath);
  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();
}

//INIT DRIVER

async function initDriver() {
  if (driver) {
    try {
      await driver.getSession();
      return driver;
    } catch {
      await closeDriver();
    }
  }

  const options = buildChromeOptions();

  killChromeProcessesUsingProfile(userDataDir);

  logger.info("Inicializando driver via Selenium Manager (auto-match com Chrome instalado)...");
  driver = await buildWithSeleniumManager(options);
  return driver;
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

module.exports = { initDriver, closeDriver };
