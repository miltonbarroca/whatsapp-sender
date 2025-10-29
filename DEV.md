# WhatsApp Sender - Dev

Este README serve como guia rápido para desenvolvedores que vão trabalhar no projeto **WhatsApp Sender**.

---

## Rodando em desenvolvimento

Para iniciar o projeto em modo de desenvolvimento:

npm install
npm start

Isso irá:

Rodar o Vite para o frontend React.

Rodar o Electron para a interface desktop.

Abrir o aplicativo com hot-reload para desenvolvimento.

Estrutura de Pastas
src/ - Código-fonte React e scripts do Electron.

src/main/whatsapp.js - Lógica de envio de mensagens via Selenium.

src/components/Presets/ - Presets de mensagens padrão.

main.js - Arquivo principal do Electron.

dist/ - Build final gerado pelo Vite + Electron Builder.

## Criando uma nova versão

Quando quiser publicar uma nova versão:

Atualize a versão do projeto (gera commit + tag):

npm version patch
Você também pode usar minor ou major conforme a necessidade.

Envie tudo para o GitHub:

git push && git push --tags
Isso aciona o workflow do GitHub Actions que:

Builda o projeto.

Cria o instalador .exe.

Publica a release no GitHub automaticamente.

Notas de Desenvolvimento
O app usa Electron + React + Vite.

Mensagens automáticas são enviadas via Selenium WebDriver.

Presets são carregados do userData ou do pacote inicial em src/components/Presets/presets.json.

Alterações no frontend devem ser refletidas automaticamente com npm start.

Para adicionar pacotes, use npm install normalmente.

Contribuindo
Faça um fork do projeto.

Crie uma branch para sua feature ou correção.

Teste localmente com npm start.

Abra um Pull Request explicando as alterações.

Contato
Issues: GitHub Issues