import React, { useState } from "react";
import "./Header.scss";
import { MessageSquare, Send, Settings, Clock } from "lucide-react";

const Button = ({ children, className = "", ...props }) => (
  <button {...props} className={`btn ${className}`}>
    {children}
  </button>
);

export default function Header() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfigure = () => {
    // Aqui você pode abrir configurações
    alert("Abrir configurações...");
  };

  const handleHistory = () => {
    // Aqui você pode abrir histórico
    alert("Abrir histórico...");
  };

  const handleSendMessages = async () => {
    const numbersTextarea = document.querySelector(".phone-card textarea");
    if (!numbersTextarea) {
      alert("Área de números não encontrada!");
      return;
    }

    const numbers = numbersTextarea.value
      .split("\n")
      .map((n) => n.replace(/\D/g, ""))
      .filter((n) => n !== "");

    if (numbers.length === 0) {
      alert("Cole pelo menos um número.");
      return;
    }

    const MESSAGE = "Olá! Esta é uma mensagem automática.";

    setIsProcessing(true);
    try {
      const { ipcRenderer } = window.require("electron");
      const result = await ipcRenderer.invoke("send-whatsapp", numbers, MESSAGE);

      if (result.success) alert("Mensagens enviadas!");
      else alert("Erro: " + result.error);
    } catch (err) {
      alert("Erro: " + err.message);
    }
    setIsProcessing(false);
  };

  return (
    <div className="header">
      <div className="header-left">
        <div className="icon-wrapper">
          <MessageSquare className="icon" />
        </div>
        <div>
          <h1 className="title">WhatsApp Bot</h1>
          <p className="subtitle">Envio em massa de mensagens</p>
        </div>
      </div>

      <div className="header-right">
        <Button onClick={handleConfigure}>
          <Settings size={18} />
          <span>Configurar</span>
        </Button>
        {/* <Button onClick={handleHistory}>
          <Clock size={18} />
          <span>Histórico</span>
        </Button> */}
        <Button
          onClick={handleSendMessages}
          disabled={isProcessing}
          className="primary"
        >
          <Send size={18} />
          <span>{isProcessing ? "Enviando..." : "Enviar"}</span>
        </Button>
      </div>
    </div>
  );
}
