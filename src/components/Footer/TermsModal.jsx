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
          <h3>Uso responsável</h3>
          <p>
            O Aplicativo facilita o envio de mensagens para contatos com os quais o Usuário possui autorização.
            É de responsabilidade do Usuário obter consentimento dos destinatários e cumprir a legislação aplicável.
          </p>

          <h3>Proibições</h3>
          <p>
            É proibido utilizar o Aplicativo para envio de spam, conteúdo ilegal, assédio, fraudes ou qualquer ação que viole os termos do WhatsApp/Meta.
          </p>

          <h3>Responsabilidades</h3>
          <p>
            O Usuário é o único responsável pelo conteúdo das mensagens, pelas listas de contatos e pelo cumprimento de normas como LGPD ou GDPR.
          </p>

          <p className="small-note">
            Este texto é um resumo; consulte os Termos completos no repositório. Este documento não substitui aconselhamento jurídico.
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
