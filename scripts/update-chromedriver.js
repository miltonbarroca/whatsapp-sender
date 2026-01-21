#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromedriverPackagePath = path.join(process.cwd(), 'node_modules', 'chromedriver');
const chromedriverLibPath = path.join(chromedriverPackagePath, 'lib', 'chromedriver');
const bundledDriversDir = path.join(process.cwd(), 'drivers', 'chromedriver');
const isWin = process.platform === 'win32';
const binaryName = isWin ? 'chromedriver.exe' : 'chromedriver';

// Proteção TOTAL contra execução em app empacotado
let isPackaged = false;
try {
  if (process.versions.electron) {
    const { app } = require('electron');
    isPackaged = app?.isPackaged === true;
  }
} catch (_) {}

if (isPackaged) {
  console.log('Skipping chromedriver update in packaged app');
  process.exit(0);
}

async function runInstallScript() {
  return new Promise((resolve, reject) => {
    const installScript = path.join(chromedriverPackagePath, 'install.js');
    if (!fs.existsSync(installScript)) {
      return reject(new Error('chromedriver install script not found'));
    }

    const env = { ...process.env, detect_chromedriver_version: 'true' };

    const proc = spawn(process.execPath, [installScript], {
      env,
      stdio: 'inherit'
    });

    proc.on('error', reject);
    proc.on('close', code => {
      code === 0
        ? resolve()
        : reject(new Error(`chromedriver install exited with code ${code}`));
    });
  });
}

function copyBinaryToBundled(dirFrom, dirTo) {
  const src = path.join(dirFrom, binaryName);
  if (!fs.existsSync(src)) {
    throw new Error(`Chromedriver binary not found at ${src}`);
  }

  fs.mkdirSync(dirTo, { recursive: true });
  const dest = path.join(dirTo, binaryName);
  fs.copyFileSync(src, dest);

  if (!isWin) {
    fs.chmodSync(dest, 0o755);
  }

  console.log('Chromedriver bundled at:', dest);
}

(async () => {
  try {
    await runInstallScript();
    copyBinaryToBundled(chromedriverLibPath, bundledDriversDir);
    console.log('Chromedriver update completed.');
  } catch (err) {
    console.warn('Chromedriver update skipped:', err.message);
    process.exit(0);
  }
})();
