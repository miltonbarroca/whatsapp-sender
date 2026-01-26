import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import "./TermsModal.scss";

const { ipcRenderer } = window.require("electron");

export default function TermsModal({ isOpen, onClose }) {
  const { isDark } = useTheme();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!isOpen) setAccepted(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccept = async () => {
    try {
      await ipcRenderer.invoke("save-settings", { acceptedTerms: true });
      onClose();
    } catch (err) {
      alert("Erro ao salvar aceite: " + (err?.message || err));
    }
  };

  return (
    <div className="modal-overlay" data-theme={isDark ? "dark" : "light"}>
      <div className="modal-content terms-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Termos de Uso — WhatsApp Sender</h2>
        <p className="modal-subtitle">Leia atentamente antes de utilizar o aplicativo.</p>

        <div className="modal-body terms-body">
          <h3>1. Definições</h3>
          <ul>
            <li>
              <strong>Aplicativo</strong> refere-se ao projeto WhatsApp Sender, software para automação de envio de mensagens.
            </li>
            <li>
              <strong>Usuário</strong> é a pessoa física ou jurídica que instala ou utiliza o Aplicativo.
            </li>
            <li>
              <strong>Conteúdo</strong> são mensagens, listas de contatos, arquivos e quaisquer dados carregados ou enviados pelo Usuário.
            </li>
          </ul>

          <h3>2. Aceitação</h3>
          <p>
            O uso do Aplicativo está condicionado à aceitação destes Termos. Ao instalar, executar ou utilizar o Aplicativo, o Usuário concorda integralmente com estes Termos.
          </p>

          <h3>3. Uso permitido</h3>
          <ul>
            <li>O Aplicativo destina-se a facilitar o envio de mensagens para contatos com os quais o Usuário já tem autorização para comunicar.</li>
            <li>É responsabilidade do Usuário garantir que possui consentimento válido dos destinatários antes de enviar mensagens em massa.</li>
          </ul>

          <h3>4. Proibições</h3>
          <ul>
            <li>É proibido utilizar o Aplicativo para: envio de spam, mensagens não solicitadas, assédio, fraudes, divulgação de conteúdo ilegal, ou qualquer prática que viole a legislação aplicável ou os termos de serviço do WhatsApp.</li>
            <li>O Usuário não deve usar o Aplicativo para contornar restrições, bloquear mecanismos anti-abuso, ou automatizar ações que violem a política de terceiros (incluindo WhatsApp/Meta).</li>
          </ul>

          <h3>5. Responsabilidades do Usuário</h3>
          <ul>
            <li>O Usuário é o único responsável pelo conteúdo das mensagens enviadas, pela listagem de contatos e pelo cumprimento das leis de privacidade e telecomunicações aplicáveis (por exemplo, LGPD, GDPR, CAN-SPAM).</li>
            <li>O Usuário concorda em indenizar os desenvolvedores por quaisquer danos, perdas ou custos decorrentes do uso indevido do Aplicativo.</li>
          </ul>

          <h3>6. Limitação de responsabilidade</h3>
          <p>
            O Aplicativo é fornecido “no estado em que se encontra”, sem garantias expressas ou implícitas. Os desenvolvedores não garantem disponibilidade contínua, ausência de bugs ou que o Aplicativo seja adequado a um propósito específico.
            Em nenhuma hipótese os desenvolvedores serão responsáveis por danos indiretos, lucros cessantes, perda de dados ou quaisquer prejuízos decorrentes do uso ou incapacidade de uso do Aplicativo.
          </p>

          <h3>7. Coleta e tratamento de dados</h3>
          <p>
            O Aplicativo pode armazenar localmente dados fornecidos pelo Usuário (listas de contatos, mensagens, logs). O desenvolvedor não coleta, compartilha ou vende dados do Usuário, salvo quando explicitamente indicado e autorizado pelo Usuário.
            É responsabilidade do Usuário tratar dados pessoais conforme a legislação aplicável e obter consentimentos necessários.
          </p>

          <h3>8. Propriedade intelectual</h3>
          <p>
            O código-fonte, interface e demais componentes do Aplicativo são de propriedade dos desenvolvedores, salvo indicação em contrário ou componentes de terceiros licenciados separadamente.
            O Usuário não deve remover avisos de direitos autorais nem distribuir cópias modificadas sem autorização.
          </p>

          <h3>9. Atualizações e alterações dos termos</h3>
          <p>
            Os desenvolvedores podem atualizar o Aplicativo ou estes Termos a qualquer momento. Mudanças materiais serão comunicadas quando possível; o uso continuado após alterações implica aceitação das novas condições.
          </p>

          <h3>10. Suspensão e rescisão</h3>
          <p>
            Os desenvolvedores podem suspender o acesso ou encerrar a disponibilização do Aplicativo caso identifiquem uso que viole estes Termos ou a lei. Obrigações e responsabilidades acumuladas antes da rescisão sobreviverão à rescisão.
          </p>

          <h3>11. Jurisdição e legislação aplicável</h3>
          <p>
            Estes Termos serão regidos pela legislação brasileira e quaisquer disputas deverão ser resolvidas nos foros competentes indicados pelos desenvolvedores.
          </p>

          <h3>12. Contato</h3>
          <p>
            Dúvidas, denúncias de uso indevido ou solicitações relacionadas a estes Termos devem ser enviadas para o contato disponibilizado no repositório ou README.
          </p>

          <h3>13. Aceite no instalador</h3>
          <p>
            O instalador exigirá que o Usuário confirme ter lido e aceitado estes Termos marcando a opção “Aceito os Termos de Uso” antes de prosseguir.
          </p>

          <label className="terms-checkbox">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>Eu li e aceito os Termos de Uso</span>
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn cancel" onClick={onClose}>Fechar</button>
          <button className="btn save" onClick={handleAccept} disabled={!accepted}>Aceitar e Continuar</button>
        </div>
      </div>
    </div>
  );
}
