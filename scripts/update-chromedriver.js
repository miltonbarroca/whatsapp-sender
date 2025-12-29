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

async function runInstallScript() {
  return new Promise((resolve, reject) => {
    const installScript = path.join(chromedriverPackagePath, 'install.js');
    if (!fs.existsSync(installScript)) {
      return reject(new Error('chromedriver install script not found'));
    }

    // detect_chromedriver_version=true makes the chromedriver package pick the compatible version
    const env = Object.assign({}, process.env, { detect_chromedriver_version: 'true' });

    const proc = spawn(process.execPath, [installScript], { env, stdio: 'inherit' });

    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error('chromedriver install script exited with code ' + code));
    });
  });
}

function copyBinaryToBundled(dirFrom, dirTo) {
  const src = path.join(dirFrom, binaryName);
  if (!fs.existsSync(src)) throw new Error('Downloaded chromedriver binary not found at: ' + src);

  fs.mkdirSync(dirTo, { recursive: true });
  const dest = path.join(dirTo, binaryName);
  fs.copyFileSync(src, dest);
  if (!isWin) {
    try { fs.chmodSync(dest, 0o755); } catch (e) { /* ignore */ }
  }
  console.log('Chromedriver copied to:', dest);
}

(async function main() {
  try {
    if (!fs.existsSync(chromedriverPackagePath)) {
      console.warn('chromedriver package not found in node_modules — skipping update.');
      process.exit(0);
    }

    await runInstallScript();

    if (!fs.existsSync(chromedriverLibPath)) {
      console.warn('chromedriver lib path not found after install — skipping copy.');
      process.exit(0);
    }

    copyBinaryToBundled(chromedriverLibPath, bundledDriversDir);
    console.log('Chromedriver update completed successfully.');
  } catch (err) {
    console.warn('Chromedriver update failed:', err && err.message ? err.message : err);
    console.warn('This is non-fatal — the existing bundled chromedriver (if any) will remain as-is.');
    process.exit(0);
  }
})();