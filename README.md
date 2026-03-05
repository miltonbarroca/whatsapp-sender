# WhatsApp Sender

Aplicativo desktop para envio assistido de mensagens pelo WhatsApp Web usando Electron e Selenium WebDriver.

## O que o app faz

- Abre uma sessão automatizada do WhatsApp Web no navegador Chrome do sistema.
- Permite colar uma lista de números e disparar mensagens em lote.
- Usa presets editáveis para `cobranca`, `prospeccao` e `renovacao`.
- Permite configurar intervalo fixo ou aleatório entre envios.
- Permite associar uma imagem ou video a cada preset.

O envio depende do seu WhatsApp Web autenticado. O app nao envia mensagens diretamente por API oficial do WhatsApp.

## Requisitos

- Google Chrome instalado na maquina.
- Internet ativa.
- Conta do WhatsApp com acesso ao WhatsApp Web.

No primeiro uso, o app precisa:

1. abrir o WhatsApp Web;
2. autenticar via QR Code, se a sessao ainda nao existir;
3. resolver automaticamente o driver compativel com a versao do Chrome instalada.

Sem Chrome instalado, o envio nao funciona.

## Como funciona

1. Abra o app.
2. Cole os numeros, um por linha.
3. Clique em `Configurar` e edite os presets de mensagem.
4. Separe variacoes de um mesmo preset com uma linha contendo apenas `---`.
5. Opcionalmente, associe uma imagem ou video ao preset.
6. Escolha o preset que deseja enviar.
7. O app abre o WhatsApp Web e faz os envios respeitando o intervalo configurado.

Quando houver mais de uma variacao dentro do preset, o app distribui essas variacoes entre os destinatarios.

## Instalacao

Baixe o instalador apropriado na pagina de Releases:

- Windows: `.exe`
- Linux: `.deb`

Depois da instalacao:

- Windows: abra normalmente pelo atalho ou menu iniciar.
- Linux: instale o `.deb` e execute o aplicativo instalado.

## Observacoes importantes

- O app automatiza a interface do WhatsApp Web. Mudancas no layout do WhatsApp podem afetar o envio.
- O app nao dispensa o uso responsavel. O usuario continua responsavel pelos contatos, conteudo enviado e conformidade legal.
- Envio com midia pode depender do comportamento atual do editor de anexos do WhatsApp Web.
- O Chrome precisa continuar instalado e acessivel no sistema apos a instalacao do app.

## Solucao de problemas

### O app nao envia mensagens

Verifique:

- se o Chrome esta instalado;
- se o WhatsApp Web abriu corretamente;
- se a sessao esta autenticada;
- se os numeros foram informados em formato valido;
- se ha bloqueios de rede, proxy ou permissao no ambiente.

### Erro relacionado a ChromeDriver / Selenium Manager

O projeto usa resolucao automatica do driver em runtime. Em geral, basta:

- manter o Chrome instalado;
- garantir internet na primeira execucao;
- tentar novamente apos atualizar o Chrome.

### Envio com imagem ou video nao conclui

O WhatsApp Web pode alterar seletores e comportamento do editor de midia. Se isso ocorrer:

- teste primeiro com envio apenas de texto;
- depois teste com 1 contato e 1 arquivo;
- use o botao `Reportar bug` do app para abrir uma issue ja preenchida.

## Feedback e bugs

Use o botao `Reportar bug` dentro do aplicativo ou abra uma issue no GitHub:

`https://github.com/miltonbarroca/whatsapp-sender/issues`
