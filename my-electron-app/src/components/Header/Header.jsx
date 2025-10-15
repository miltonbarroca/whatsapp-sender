import React, { useState } from "react";
import { MessageSquare, Settings as SettingsIcon } from "lucide-react";
import Settings from "../Settings/Settings";
import "./Header.scss";

const Button = ({ children, className = "", ...props }) => (
  <button {...props} className={`btn ${className}`}>
    {children}
  </button>
);

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleConfigure = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <div className="header">
      <div className="header-left">
        <div className="icon-wrapper">
          <MessageSquare className="icon" />
        </div>
        <div>
          <h1 className="title">WhatsApp Sender</h1>
          <p className="subtitle">Envio em massa de mensagens</p>
        </div>
      </div>

      <div className="header-right">
        <Button onClick={handleConfigure}>
          <SettingsIcon size={18} />
          <span>Configurar</span>
        </Button>
      </div>

      <Settings isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </div>
  );
}
