const { Builder, By, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");
const os = require("os"); // <-- adicionado
require("chromedriver");

// Caminho seguro para armazenamento do perfil do Chrome
const userDataDir = path.join(os.homedir(), "WhatsappSenderUserData");

if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

let driver = null; // driver global para manter aberto

// Inicializa driver (uma vez)
async function initDriver() {
  if (driver) return driver;

  const options = new chrome.Options();
  options.addArguments(`--user-data-dir=${userDataDir}`);
  options.addArguments("--start-maximized");

  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  await driver.get("https://web.whatsapp.com");

  // Espera QR code ser escaneado na primeira execução
  let qrCodeVisible = true;
  while (qrCodeVisible) {
    try {
      await driver.findElement(By.xpath("//canvas[@aria-label='Scan me!']"));
      console.log("Aguardando QR code ser escaneado...");
      await new Promise((r) => setTimeout(r, 5000));
    } catch {
      qrCodeVisible = false;
    }
  }

  console.log("Sessão logada");
  return driver;
}

// Envia mensagens
async function sendMessages(numbers, messages) {
  const driver = await initDriver();

  for (let i = 0; i < numbers.length; i++) {
    const number = numbers[i].trim();
    const message = messages[i];

    if (!number || !message) continue;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodedMessage}`;

    await driver.get(url);
    await driver.sleep(10000); // espera carregar

    let messageBox = null;
    for (let j = 0; j < 10; j++) {
      try {
        messageBox = await driver.findElement(
          By.xpath("//div[@contenteditable='true' and @data-tab='10']")
        );
        break;
      } catch {
        await driver.sleep(1000);
      }
    }

    if (messageBox) {
      await messageBox.sendKeys(Key.ENTER);
      console.log(`Mensagem enviada para ${number}`);
    } else {
      console.log(`Campo de mensagem não encontrado para ${number}`);
    }

    await driver.sleep(3000);
  }

  console.log("Envio concluído!");
}

async function closeDriver() {
  if (driver) {
    await driver.quit();
    driver = null;
    console.log("Driver fechado!");
  }
}

module.exports = { sendMessages, closeDriver };
