import React from "react";
import "./Presets.scss";
import { DollarSign, UserPlus, RefreshCw } from "lucide-react";
import cobrancaMessages from "./cobranca.json";

export default function Presets({ onSelectPreset }) {
    const sendCobrança = async () => {
        if (!window.require) return;

        const { ipcRenderer } = window.require("electron");

        // Pega os números do textarea
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

        // Cria um array de mensagens aleatórias para cada número
        const messages = numbers.map(() => {
            const randomIndex = Math.floor(Math.random() * cobrancaMessages.length);
            return cobrancaMessages[randomIndex];
        });

        await ipcRenderer.invoke("send-whatsapp-multiple", numbers, messages);


        // Envia via IPC
        try {
            const result = await ipcRenderer.invoke("send-whatsapp-multiple", numbers, messages);
            if (result.success) alert("Mensagens de cobrança enviadas!");
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
                    onClick={() => onSelectPreset?.("prospeccao")}
                >
                    <UserPlus size={22} />
                    <span>Prospecção</span>
                </button>

                <button
                    className="preset-btn danger"
                    onClick={sendCobrança}
                >
                    <DollarSign size={22} />
                    <span>Cobrança</span>
                </button>

                <button
                    className="preset-btn success"
                    onClick={() => onSelectPreset?.("renovacao")}
                >
                    <RefreshCw size={22} />
                    <span>Renovação</span>
                </button>
            </div>
        </div>
    );
}
