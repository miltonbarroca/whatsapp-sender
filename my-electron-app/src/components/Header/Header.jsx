import React from "react";
import "./Header.scss";

// Placeholders para ícones e botões
const MessageSquare = () => <div style={{ width: 24, height: 24, background: "#ccc" }} />;
const Settings = () => <div style={{ width: 16, height: 16, background: "#ccc" }} />;
const Clock = () => <div style={{ width: 16, height: 16, background: "#ccc" }} />;
const Send = () => <div style={{ width: 16, height: 16, background: "#ccc" }} />;
const Button = ({ children, ...props }) => (
  <button {...props} style={{ padding: "0.5rem 1rem", borderRadius: 4 }}>
    {children}
  </button>
);

export default function Header() {
  // Placeholders para funções
  const handleConfigure = () => {};
  const handleHistory = () => {};
  const handleSendMessages = () => {};
  const isProcessing = false;

  return (
    <div className="header">
      <div className="header-left">
        <div className="icon-wrapper">
          <MessageSquare />
        </div>
        <div>
          <h1 className="title">WhatsApp Bot</h1>
          <p className="subtitle">Envio em massa de mensagens</p>
        </div>
      </div>

      <div className="header-right">
        <Button onClick={handleConfigure} className="btn">
          <Settings /> Configurar
        </Button>
        <Button onClick={handleHistory} className="btn">
          <Clock /> Histórico
        </Button>
        <Button onClick={handleSendMessages} disabled={isProcessing} className="btn primary">
          <Send /> {isProcessing ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
