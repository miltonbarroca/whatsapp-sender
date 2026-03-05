import { useEffect, useState } from "react";
import { ArrowDownCircle, Bug, MessageSquare, Settings as SettingsIcon } from "lucide-react";
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
  const [appInfo, setAppInfo] = useState({
    version: "desconhecida",
    platform: "desconhecida",
    arch: "desconhecida"
  });

  useEffect(() => {
    ipcRenderer.on("update-available", (event, info) => {
      setUpdateInfo(info);
    });

    ipcRenderer
      .invoke("get-app-info")
      .then((info) => {
        if (!info) return;
        setAppInfo({
          version: info.version || "desconhecida",
          platform: info.platform || "desconhecida",
          arch: info.arch || "desconhecida"
        });
      })
      .catch(() => {});

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

  const handleReportBug = () => {
    const title = encodeURIComponent("[Bug] Descreva o problema");
    const body = encodeURIComponent(
      [
        "## Descrição",
        "Descreva claramente o erro encontrado.",
        "",
        "## Passos para reproduzir",
        "1. ...",
        "2. ...",
        "3. ...",
        "",
        "## Comportamento esperado",
        "O que deveria acontecer?",
        "",
        "## Logs / Erro",
        "Cole aqui mensagens de erro relevantes.",
        "",
        "## Ambiente",
        `- Versão do app: ${appInfo.version}`,
        `- Plataforma: ${appInfo.platform}`,
        `- Arquitetura: ${appInfo.arch}`
      ].join("\n")
    );

    const labels = encodeURIComponent("bug");
    const issueUrl = `https://github.com/miltonbarroca/whatsapp-sender/issues/new?labels=${labels}&title=${title}&body=${body}`;
    window.open(issueUrl, "_blank");
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
        {updateInfo && (
          <button className="btn update-btn" onClick={handleOpenUpdate} title={`Nova versão ${updateInfo.version} disponível`}>
            <ArrowDownCircle color="#4ade80" size={20} />
          </button>
        )}
        <button className="btn" onClick={handleConfigure}>
          <SettingsIcon size={18} />
          <span>Configurar</span>
        </button>
        <button className="btn bug-btn" onClick={handleReportBug}>
          <Bug size={18} />
          <span>Reportar bug</span>
        </button>
      </div>

      <Settings isOpen={isSettingsOpen} onClose={handleCloseSettings} />
    </div>
  );
}
