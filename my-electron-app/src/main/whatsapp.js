const { Builder, By, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");
const path = require("path");
require("chromedriver"); // garante que o binário do chromedriver está registrado

async function sendMessages(numbers, message) {
  const options = new chrome.Options();

  // Mantém sessão logada
  const userDataDir = path.join(process.cwd(), "User_Data");
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir);
  options.addArguments(`--user-data-dir=${userDataDir}`);

  // Opcional: abrir maximizado
  options.addArguments("--start-maximized");

  // Inicializa o driver SEM usar ServiceBuilder
  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("https://web.whatsapp.com");

    // Espera QR code ser escaneado
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

    for (let number of numbers) {
      number = number.trim();
      if (!number) continue;

      const encodedMessage = encodeURIComponent(message);
      const url = `https://web.whatsapp.com/send?phone=${number}&text=${encodedMessage}`;

      await driver.get(url);
      await driver.sleep(10000);

      let messageBox = null;
      for (let i = 0; i < 10; i++) {
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
  } finally {
    await driver.quit();
  }
}

module.exports = { sendMessages };
