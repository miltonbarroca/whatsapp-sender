import React, { useState, useEffect } from "react";
import "./Settings.scss";

export default function Settings({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState("cobranca");
    const [messages, setMessages] = useState({
        cobranca: "",
        prospeccao: "",
        renovacao: ""
    });
    const [messageInterval, setMessageInterval] = useState(60);

    useEffect(() => {
        if (!window.require) return;
        const { ipcRenderer } = window.require("electron");

        if (isOpen) {
            ipcRenderer.invoke("load-settings").then((settings) => {
                if (settings.messageInterval) setMessageInterval(settings.messageInterval);
            });

            ipcRenderer.invoke("load-presets").then((data) => {
                const parseMessages = (arr = []) =>
                    arr
                        .map((item) => (typeof item === "string" ? item : item.text))
                        .join("\n---\n");

                setMessages({
                    cobranca: parseMessages(data.cobranca),
                    prospeccao: parseMessages(data.prospeccao),
                    renovacao: parseMessages(data.renovacao)
                });
            });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setMessages({ ...messages, [activeTab]: e.target.value });
    };

    const handleSave = async () => {
        if (!window.require) return;
        const { ipcRenderer } = window.require("electron");

        const buildArray = (text, startId = 1) => {
            const SEPARATOR_REGEX = /\n\s*---\s*\n/g;
            return text
                .split(SEPARATOR_REGEX)
                .map(m => m.trim())
                .filter(m => m !== "")
                .map((m, index) => ({ id: startId + index, text: m }));
        };

        try {
            const payloadPresets = {
                cobranca: buildArray(messages.cobranca, 1),
                prospeccao: buildArray(messages.prospeccao, 1),
                renovacao: buildArray(messages.renovacao, 1)
            };

            await ipcRenderer.invoke("save-presets", payloadPresets);
            await ipcRenderer.invoke("save-settings", { messageInterval });

            alert("Presets e configurações salvos com sucesso!");
            onClose();
        } catch (err) {
            alert("Erro ao salvar: " + err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <h2 className="modal-title">Configurar Presets de Mensagens</h2>
                <p className="modal-subtitle">Edite os presets de mensagens e o intervalo entre envios</p>

                <div className="modal-tabs">
                    <button className={`tab-btn ${activeTab === "cobranca" ? "active" : ""}`} onClick={() => setActiveTab("cobranca")}>Cobrança</button>
                    <button className={`tab-btn ${activeTab === "prospeccao" ? "active" : ""}`} onClick={() => setActiveTab("prospeccao")}>Prospecção</button>
                    <button className={`tab-btn ${activeTab === "renovacao" ? "active" : ""}`} onClick={() => setActiveTab("renovacao")}>Renovação</button>
                </div>

                <div className="modal-body">
                    <label className="modal-label">
                        Intervalo entre mensagens (segundos, mínimo 60)
                    </label>
                    <input
                        type="number"
                        min={60}
                        value={messageInterval}
                        onChange={(e) => setMessageInterval(Math.max(60, parseInt(e.target.value)))}
                    />

                    <label className="modal-label" style={{ marginTop: "1rem" }}>
                        Mensagem de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </label>
                    <textarea
                        className="modal-textarea"
                        value={messages[activeTab]}
                        onChange={handleChange}
                        placeholder="Escreva as mensagens. Separe variações com uma linha contendo apenas ---"
                        rows={10}
                    />
                </div>

                <div className="modal-footer">
                    <button className="btn cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn save" onClick={handleSave}>Salvar Presets</button>
                </div>
            </div>
        </div>
    );
}
