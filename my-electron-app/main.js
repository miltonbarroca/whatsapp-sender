const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { sendMessages, closeDriver } = require("./src/main/whatsapp.js"); // ajustado para manter driver

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

// Envia mesma mensagem para todos os números (compatibilidade com antigo front)
ipcMain.handle("send-whatsapp", async (event, numbers, message) => {
  try {
    // Cria um array de mensagens repetindo a mesma mensagem
    const messages = numbers.map(() => message);
    await sendMessages(numbers, messages);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Novo canal para enviar mensagens diferentes para cada número
ipcMain.handle("send-whatsapp-multiple", async (event, numbers, messages) => {
  try {
    await sendMessages(numbers, messages);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Fecha driver ao sair do app
app.on("before-quit", async () => {
  await closeDriver();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
