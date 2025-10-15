import React from "react";
import "./Presets.scss";
import { DollarSign, UserPlus, RefreshCw } from "lucide-react";
import cobrancaMessages from "./cobranca.json"; 

export default function Presets({ onSelectPreset }) {
  const sendCobrança = async () => {
    if (!window.require) return;

    const { ipcRenderer } = window.require("electron");

    // Escolhe aleatoriamente uma mensagem
    const randomIndex = Math.floor(Math.random() * cobrancaMessages.length);
    const message = cobrancaMessages[randomIndex];

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

    // Envia via IPC
    try {
      const result = await ipcRenderer.invoke("send-whatsapp", numbers, message);
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
