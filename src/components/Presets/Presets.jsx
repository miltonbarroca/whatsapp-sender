import React, { useEffect, useState } from "react";
import "./Presets.scss";
import { DollarSign, UserPlus, RefreshCw } from "lucide-react";

export default function Presets({ onSelectPreset }) {
    const [presets, setPresets] = useState({});

    useEffect(() => {
        if (!window.require) return;
        const { ipcRenderer } = window.require("electron");

        ipcRenderer.invoke("load-presets").then((data) => {
            if (!data.error) setPresets(data);
        }).catch(err => {
            console.error("Erro ao carregar presets:", err);
        });
    }, []);

    const sendMessages = async (presetName) => {
        if (!window.require) return;

        const { ipcRenderer } = window.require("electron");

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

        const messagesList = presets[presetName];
        if (!messagesList || messagesList.length === 0) {
            alert(`Preset "${presetName}" vazio.`);
            return;
        }

        const messages = numbers.map(() => {
            const randomIndex = Math.floor(Math.random() * messagesList.length);
            return messagesList[randomIndex].text;
        });

        console.log("Enviando mensagens:");
        console.log("Números:", numbers);
        console.log("Mensagens:", messages);

        try {
            const result = await ipcRenderer.invoke("send-whatsapp-multiple", numbers, messages);
            if (result.success) alert("Mensagens enviadas!");
            else alert("Erro: " + result.error);
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    return (
        <div className="presets-container">
            <div className="presets-header">
                <h2>Presets de Mensagens</h2>
                <p>Selecione um preset para carregar uma mensagem predefinida</p>
            </div>

            <div className="presets-buttons">
                <button
                    className="preset-btn success"
                    onClick={() => sendMessages("prospeccao")}
                >
                    <UserPlus size={22} />
                    <span>Prospecção</span>
                </button>

                <button
                    className="preset-btn danger"
                    onClick={() => sendMessages("cobranca")}
                >
                    <DollarSign size={22} />
                    <span>Cobrança</span>
                </button>

                <button
                    className="preset-btn success"
                    onClick={() => sendMessages("renovacao")}
                >
                    <RefreshCw size={22} />
                    <span>Renovação</span>
                </button>
            </div>
        </div>
    );
}
