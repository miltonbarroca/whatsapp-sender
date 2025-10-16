// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("whatsappAPI", {
  sendMessages: (numbers, message) => ipcRenderer.invoke("send-whatsapp", numbers, message),
});
