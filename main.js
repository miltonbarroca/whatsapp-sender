const { app, BrowserWindow, ipcMain, net } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");
const { sendMessages, closeDriver } = require("./src/main/whatsapp.js");
const { version } = require("./package.json");

const userDataDir = app.getPath("userData");
const userPresetsPath = path.join(userDataDir, "presets.json");
const bundledPresetsPath = path.resolve(__dirname, "src/components/Presets/presets.json");
const userSettingsPath = path.join(userDataDir, "settings.json");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "dist", "index.html");
    win.loadFile(indexPath).catch((err) => console.error("Erro ao carregar index.html:", err));
  }
}

async function checkForUpdates() {
  const request = net.request("https://api.github.com/repos/miltonbarroca/whatsapp-sender/releases/latest");

  return new Promise((resolve, reject) => {
    request.on("response", (response) => {
      let body = "";
      response.on("data", (chunk) => body += chunk);
      response.on("end", () => {
        try {
          const data = JSON.parse(body);
          const latest = data.tag_name?.replace("v", "") ?? null;
          if (latest && latest !== version) {
            win.webContents.send("update-available", { version: latest, url: data.html_url });
          }
          resolve();
        } catch (err) { reject(err); }
      });
    });
    request.on("error", (err) => reject(err));
    request.setHeader("User-Agent", "Electron-App");
    request.end();
  });
}

app.whenReady().then(() => {
  createWindow();
  setTimeout(checkForUpdates, 5000);
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// Presets
ipcMain.handle("load-presets", async () => {
  try {
    if (!fs.existsSync(userPresetsPath)) {
      const defaultData = fs.existsSync(bundledPresetsPath)
        ? JSON.parse(fs.readFileSync(bundledPresetsPath, "utf8"))
        : {
          cobranca: ["Olá, estamos entrando em contato sobre sua cobrança pendente."],
          prospeccao: ["Olá, gostaríamos de apresentar nossos serviços."],
          renovacao: ["Olá, sua assinatura está prestes a expirar."],
        };
      fs.mkdirSync(userDataDir, { recursive: true });
      fs.writeFileSync(userPresetsPath, JSON.stringify(defaultData, null, 2), "utf8");
    }
    const data = fs.readFileSync(userPresetsPath, "utf8");
    const jsonData = JSON.parse(data);
    jsonData.cobranca ||= [];
    jsonData.prospeccao ||= [];
    jsonData.renovacao ||= [];
    return jsonData;
  } catch (err) {
    console.error("Erro ao carregar presets:", err);
    return { cobranca: [], prospeccao: [], renovacao: [] };
  }
});

ipcMain.handle("save-presets", async (event, newData) => {
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(userPresetsPath, JSON.stringify(newData, null, 2), "utf8");
    return { success: true };
  } catch (err) {
    console.error("Erro ao salvar presets:", err);
    throw err;
  }
});

// Settings
ipcMain.handle("load-settings", async () => {
  try {
    if (!fs.existsSync(userSettingsPath)) {
      const defaultSettings = { messageInterval: 60 };
      fs.writeFileSync(userSettingsPath, JSON.stringify(defaultSettings, null, 2), "utf8");
      return defaultSettings;
    }
    const data = fs.readFileSync(userSettingsPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao carregar settings:", err);
    return { messageInterval: 60 };
  }
});

ipcMain.handle("save-settings", async (event, newSettings) => {
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(userSettingsPath, JSON.stringify(newSettings, null, 2), "utf8");
    return { success: true };
  } catch (err) {
    console.error("Erro ao salvar settings:", err);
    throw err;
  }
});

// Enviar mensagens
ipcMain.handle("send-whatsapp-multiple", async (event, numbers, messages) => {
  try {
    const settings = fs.existsSync(userSettingsPath)
      ? JSON.parse(fs.readFileSync(userSettingsPath, "utf8"))
      : { messageInterval: 60 };

    await sendMessages(numbers, messages, settings.messageInterval);
    return { success: true };
  } catch (err) {
    console.error("Erro ao enviar mensagens:", err);
    return { success: false, error: err.message };
  }
});
