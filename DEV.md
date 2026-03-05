# WhatsApp Sender - Desenvolvimento

Guia rapido para desenvolvimento, build e release do projeto.

## Stack

- Electron
- React
- Vite
- Selenium WebDriver
- Chrome + Selenium Manager para resolucao automatica do driver

## Requisitos locais

- Node.js 22
- npm
- Google Chrome instalado

O projeto depende do Chrome do sistema. O Selenium Manager resolve o driver compativel em runtime. Na primeira execucao, isso pode exigir internet.

## Rodando em desenvolvimento

```bash
npm install
npm start
```

Isso inicia:

- frontend Vite;
- processo Electron;
- hot reload para a interface.

## Fluxo principal do app

- `src/components/PhoneNumbers/`: entrada de numeros.
- `src/components/Presets/`: disparo de envio por preset.
- `src/components/Settings/`: configuracao de presets, intervalos e midia.
- `main.js`: processo principal do Electron e handlers IPC.
- `src/main/driverHandler.js`: inicializacao do Selenium/Chrome.
- `src/main/whatsapp.js`: fluxo de envio no WhatsApp Web.

## Persistencia local

Os dados do usuario ficam no `userData` do Electron. Em especial:

- `presets.json`
- `settings.json`
- logs da aplicacao
- cache do Selenium Manager

No Linux e em fallback sem Electron, parte disso tambem pode aparecer em `~/WhatsappSenderUserData`.

## Build local

Build generico:

```bash
npm run build
```

Build de release por plataforma:

```bash
npm run release:win
npm run release:linux
```

## Releases

As releases sao geradas via GitHub Actions ao criar uma tag `v*`.

Fluxo comum:

```bash
npm version patch
git push
git push --tags
```

O workflow:

- instala dependencias com retry;
- gera build Windows `.exe`;
- gera build Linux `.deb`;
- publica os artefatos na release do GitHub.

## Observacoes sobre empacotamento

- No Linux, o build usa `executableName: whatsapp-sender`.
- O `productName` foi ajustado para evitar problemas com caminhos contendo espacos.
- O Selenium Manager empacotado precisa ser acessado fora do `app.asar`, via `app.asar.unpacked`.

## Troubleshooting de desenvolvimento

### Erro de Selenium / Chrome

Verifique:

- se o Chrome esta instalado;
- se o Chrome abre normalmente no sistema;
- se a maquina tem internet na primeira execucao;
- se o app conseguiu criar cache em `selenium-cache`.

### Falha de release no CI

Os erros mais comuns recentes nao foram de codigo, e sim de download:

- `EOF`
- `socket hang up`

O workflow ja tem cache e retry para `npm install` e `electron-builder`, mas ainda vale reexecutar o job quando a falha for claramente de rede.

## Boas praticas ao alterar o projeto

- Teste envio apenas de texto antes de testar envio com midia.
- Ao mexer no fluxo Selenium, valide com 1 contato primeiro.
- Evite hardcode de caminhos absolutos.
- Em Linux empacotado, considere sempre `process.resourcesPath` e `app.asar.unpacked`.
