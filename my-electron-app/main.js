const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { sendMessages } = require("./src/main/whatsapp.js"); // require comum

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // já permite usar require('electron') no React
      contextIsolation: false, // necessário para nodeIntegration
      // preload: path.join(__dirname, "preload.js"), // remover ou comentar
    },
  });


  win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);

ipcMain.handle("send-whatsapp", async (event, numbers, message) => {
  try {
    await sendMessages(numbers, message);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
