const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { sendMessages, closeDriver } = require("./src/main/whatsapp.js");

const presetsPath = path.resolve(__dirname, "src/components/Presets/presets.json");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

// Carregar presets
ipcMain.handle("load-presets", async () => {
  try {
    if (!fs.existsSync(presetsPath)) {
      const defaultData = {
        cobranca: ["Olá, estamos entrando em contato sobre sua cobrança pendente."],
        prospeccao: ["Olá, gostaríamos de apresentar nossos serviços."],
        renovacao: ["Olá, sua assinatura está prestes a expirar."]
      };
      fs.writeFileSync(presetsPath, JSON.stringify(defaultData, null, 2), "utf8");
      return defaultData;
    }

    const data = fs.readFileSync(presetsPath, "utf8");
    const jsonData = JSON.parse(data);

    // Garante que todos os campos existam
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
    fs.writeFileSync(presetsPath, JSON.stringify(newData, null, 2), "utf8");
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
