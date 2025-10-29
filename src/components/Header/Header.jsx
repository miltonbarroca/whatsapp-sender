import { useEffect, useState } from "react";
import { ArrowDownCircle, MessageSquare, Settings as SettingsIcon } from "lucide-react";
import Settings from "../Settings/Settings";
import "./Header.scss";

const { ipcRenderer } = window.require("electron");

const Button = ({ children, className = "", ...props }) => (
  <button {...props} className={`btn ${className}`}>
    {children}
  </button>
);

export default function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    ipcRenderer.on("update-available", (event, info) => {
      setUpdateInfo(info);
    });

    return () => {
      ipcRenderer.removeAllListeners("update-available");
    };
  }, []);

  const handleOpenUpdate = () => {
    if (updateInfo?.url) {
      window.open(updateInfo.url, "_blank");
    }
  };

  const handleConfigure = () => setIsSettingsOpen(true);
  const handleCloseSettings = () => setIsSettingsOpen(false);

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
        {updateInfo && (
          <button className="btn update-btn" onClick={handleOpenUpdate} title={`Nova versão ${updateInfo.version} disponível`}>
            <ArrowDownCircle color="#4ade80" size={20} />
          </button>
        )}
        <button className="btn" onClick={handleConfigure}>
          <SettingsIcon size={18} />
          <span>Configurar</span>
        </button>
      </div>

      <Settings isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </div>
  );
}

