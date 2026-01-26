const { app, BrowserWindow, ipcMain, net } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");
const { sendMessages, closeDriver } = require("./src/main/whatsapp.js");
const { version } = require("./package.json");
const { logger } = require("./src/main/logger");

const userDataDir = app.getPath("userData");
const userPresetsPath = path.join(userDataDir, "presets.json");
const bundledPresetsPath = path.resolve(__dirname, "src/components/Presets/presets.json");
const userSettingsPath = path.join(userDataDir, "settings.json");

let win;

/* =========================
   CREATE WINDOW
========================= */
function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

    win.webContents.openDevTools();


  const { Menu } = require("electron");
  Menu.setApplicationMenu(null);

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "dist", "index.html");
    win
      .loadFile(indexPath)
      .catch(err =>
        logger.error("Erro ao carregar index.html: " + (err?.message || err))
      );
  }
}

/* =========================
   CHECK FOR UPDATES
========================= */
async function checkForUpdates() {
  const request = net.request(
    "https://api.github.com/repos/miltonbarroca/whatsapp-sender/releases/latest"
  );

  return new Promise((resolve, reject) => {
    request.on("response", response => {
      let body = "";
      response.on("data", chunk => (body += chunk));
      response.on("end", () => {
        try {
          const data = JSON.parse(body);
          const latest = data.tag_name?.replace("v", "") ?? null;
          if (latest && latest !== version) {
            win.webContents.send("update-available", {
              version: latest,
              url: data.html_url
            });
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
    request.on("error", err => reject(err));
    request.setHeader("User-Agent", "Electron-App");
    request.end();
  });
}

/* =========================
   APP LIFECYCLE
========================= */
app.whenReady().then(() => {
  createWindow();
  setTimeout(checkForUpdates, 5000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* =========================
   PRESETS
========================= */
ipcMain.handle("load-presets", async () => {
  try {
    if (!fs.existsSync(userPresetsPath)) {
      const defaultData = fs.existsSync(bundledPresetsPath)
        ? JSON.parse(fs.readFileSync(bundledPresetsPath, "utf8"))
        : {
            cobranca: [{ text: "Olá, estamos entrando em contato sobre sua cobrança pendente." }],
            prospeccao: [{ text: "Olá, gostaríamos de apresentar nossos serviços." }],
            renovacao: [{ text: "Olá, sua assinatura está prestes a expirar." }]
          };

      fs.mkdirSync(userDataDir, { recursive: true });
      fs.writeFileSync(
        userPresetsPath,
        JSON.stringify(defaultData, null, 2),
        "utf8"
      );
    }

    const jsonData = JSON.parse(
      fs.readFileSync(userPresetsPath, "utf8")
    );

    jsonData.cobranca = (jsonData.cobranca || []).map(m => ({ text: m?.text?.trim() || "" }));
    jsonData.prospeccao = (jsonData.prospeccao || []).map(m => ({ text: m?.text?.trim() || "" }));
    jsonData.renovacao = (jsonData.renovacao || []).map(m => ({ text: m?.text?.trim() || "" }));

    return jsonData;
  } catch (err) {
    logger.error("Erro ao carregar presets: " + (err?.message || err));
    return { cobranca: [], prospeccao: [], renovacao: [] };
  }
});

ipcMain.handle("save-presets", async (_, newData) => {
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(
      userPresetsPath,
      JSON.stringify(newData, null, 2),
      "utf8"
    );
    return { success: true };
  } catch (err) {
    logger.error("Erro ao salvar presets: " + (err?.message || err));
    throw err;
  }
});

/* =========================
   SETTINGS (PADRÃO NOVO)
========================= */
ipcMain.handle("load-settings", async () => {
  try {
    if (!fs.existsSync(userSettingsPath)) {
      const defaultSettings = {
        delaySeconds: 60,
        randomize: false,
        randomVariation: 0,
        acceptedTerms: false
      };
      fs.writeFileSync(
        userSettingsPath,
        JSON.stringify(defaultSettings, null, 2),
        "utf8"
      );
      return defaultSettings;
    }

    const data = JSON.parse(
      fs.readFileSync(userSettingsPath, "utf8")
    );

    return {
      delaySeconds: data.delaySeconds ?? data.messageInterval ?? 60,
      randomize: Boolean(data.randomize),
      randomVariation: data.randomVariation ?? 0,
      acceptedTerms: Boolean(data.acceptedTerms)
    };
  } catch (err) {
    logger.error("Erro ao carregar settings: " + (err?.message || err));
    return {
      delaySeconds: 60,
      randomize: false,
      randomVariation: 0,
      acceptedTerms: false
    };
  }
});

ipcMain.handle("save-settings", async (_, newSettings) => {
  try {
    const rawSettings = fs.existsSync(userSettingsPath)
      ? JSON.parse(fs.readFileSync(userSettingsPath, "utf8"))
      : {};

    const normalizedSettings = {
      delaySeconds: Math.max(60, newSettings.delaySeconds ?? rawSettings.delaySeconds ?? 60),
      randomize: Boolean(newSettings.randomize ?? rawSettings.randomize),
      randomVariation: Math.max(0, newSettings.randomVariation ?? rawSettings.randomVariation ?? 0),
      acceptedTerms: Boolean(newSettings.acceptedTerms ?? rawSettings.acceptedTerms ?? false)
    };

    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(
      userSettingsPath,
      JSON.stringify(normalizedSettings, null, 2),
      "utf8"
    );

    return { success: true };
  } catch (err) {
    logger.error("Erro ao salvar settings: " + (err?.message || err));
    throw err;
  }
});

/* =========================
   ENVIAR MENSAGENS
========================= */
ipcMain.handle("send-whatsapp-multiple", async (_, numbers, messages) => {
  try {
    const rawSettings = fs.existsSync(userSettingsPath)
      ? JSON.parse(fs.readFileSync(userSettingsPath, "utf8"))
      : {};

    const settings = {
      delaySeconds: rawSettings.delaySeconds ?? rawSettings.messageInterval ?? 60,
      randomize: Boolean(rawSettings.randomize),
      randomVariation: rawSettings.randomVariation ?? 0
    };

    numbers = (numbers || []).map(n => n?.replace(/\D/g, "").trim());
    messages = (messages || []).map(m => m?.trim());

    if (!numbers.length || !messages.length) {
      throw new Error("Arrays de números ou mensagens estão vazios.");
    }

    await sendMessages(numbers, messages, settings);
    return { success: true };
  } catch (err) {
    logger.error("Erro ao enviar mensagens: " + (err?.message || err));
    return { success: false, error: err.message };
  }
});

/* =========================
   FECHAR DRIVER
========================= */
ipcMain.handle("close-driver", async () => {
  try {
    await closeDriver();
    return { success: true };
  } catch (err) {
    logger.error("Erro ao fechar driver: " + (err?.message || err));
    return { success: false, error: err.message };
  }
});
