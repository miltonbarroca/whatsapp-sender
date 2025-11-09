const fs = require('fs');
const path = require('path');
const os = require('os');

// Resolve base directory for logs. Prefer electron's userData when available.
let baseDir;
try {
  const { app } = require('electron');
  baseDir = app && typeof app.getPath === 'function'
    ? app.getPath('userData')
    : path.join(os.homedir(), 'WhatsappSenderUserData');
} catch (e) {
  baseDir = path.join(os.homedir(), 'WhatsappSenderUserData');
}

const logDir = path.join(baseDir, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
  ),
  transports: [
    new transports.File({ filename: path.join(logDir, 'app.log'), maxsize: 5 * 1024 * 1024 }),
    new transports.Console(),
  ],
});

const messagesLogPath = path.join(logDir, 'messages.log');

function logMessageStatus(number, success, details = '') {
  const entry = {
    timestamp: new Date().toISOString(),
    number,
    success: !!success,
    details: details || ''
  };
  try {
    fs.appendFileSync(messagesLogPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    logger.error(`Falha ao gravar messages.log: ${err.message}`);
  }
  logger.info(`${success ? 'ENVIADO' : 'FALHA'} - ${number}${details ? ' - ' + details : ''}`);
}

module.exports = { logger, logMessageStatus };
