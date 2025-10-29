const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");
const { sendMessages, closeDriver } = require("./src/main/whatsapp.js");

const bundledPresetsPath = path.resolve(__dirname, "src/components/Presets/presets.json");
const userDataDir = app.getPath("userData");
const userPresetsPath = path.join(userDataDir, "presets.json");

const { net } = require("electron");
const { version } = require("./package.json");

// Função para verificar se há nova versão
async function checkForUpdates() {
  const request = net.request("https://api.github.com/repos/miltonbarroca/whatsapp-sender/releases/latest");

  return new Promise((resolve, reject) => {
    request.on("response", (response) => {
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          const data = JSON.parse(body);
          const latest = data.tag_name?.replace("v", "") ?? null;

          if (latest && latest !== version) {
            console.log(`Nova versão disponível: ${latest}`);
            win.webContents.send("update-available", {
              version: latest,
              url: data.html_url,
            });
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on("error", (err) => reject(err));
    request.setHeader("User-Agent", "Electron-App");
    request.end();
  });
}

app.whenReady().then(async () => {
  createWindow();

  // Verifica updates 5s depois do app iniciar
  setTimeout(checkForUpdates, 5000);
});

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
    // caminho absoluto para index.html dentro do build
    const indexPath = path.join(__dirname, "dist", "index.html");
    win.loadFile(indexPath).catch((err) => {
      console.error("Erro ao carregar index.html:", err);
    });
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Carregar presets
ipcMain.handle("load-presets", async () => {
  try {
    // Garante que há um presets.json em userData; se não houver, tenta copiar do empacotado
    if (!fs.existsSync(userPresetsPath)) {
      try {
        const defaultData = fs.existsSync(bundledPresetsPath)
          ? JSON.parse(fs.readFileSync(bundledPresetsPath, "utf8"))
          : {
              cobranca: ["Olá, estamos entrando em contato sobre sua cobrança pendente."],
              prospeccao: ["Olá, gostaríamos de apresentar nossos serviços."],
              renovacao: ["Olá, sua assinatura está prestes a expirar."],
            };
        fs.mkdirSync(userDataDir, { recursive: true });
        fs.writeFileSync(userPresetsPath, JSON.stringify(defaultData, null, 2), "utf8");
      } catch (e) {
        console.error("Falha ao inicializar presets em userData:", e);
      }
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

// Salvar presets
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

// Enviar mensagens
ipcMain.handle("send-whatsapp-multiple", async (event, numbers, messages) => {
  try {
    console.log("IPC chamado: send-whatsapp-multiple", numbers, messages);
    await sendMessages(numbers, messages);
    return { success: true };
  } catch (err) {
    console.error("Erro ao enviar mensagens:", err);
    return { success: false, error: err.message };
  }
});
