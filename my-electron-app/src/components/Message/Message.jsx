import React, { useState } from "react";

export default function Message() {
  const [message, setMessage] = useState("");
  const [numbers, setNumbers] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const numbersArray = numbers
      .split("\n")
      .map((n) => n.replace(/\D/g, ""))
      .filter((n) => n !== "");

    if (!message || numbersArray.length === 0) {
      alert("Digite a mensagem e pelo menos um número.");
      return;
    }

    setLoading(true);

    try {
      // Com nodeIntegration ligado, podemos usar ipcRenderer direto
      const { ipcRenderer } = window.require("electron");

      const result = await ipcRenderer.invoke("send-whatsapp", numbersArray, message);


      if (result.success) alert("Mensagens enviadas!");
      else alert("Erro: " + result.error);
    } catch (err) {
      alert("Erro: " + err.message);
    }

    setLoading(false);
    setMessage("");
    setNumbers("");
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Enviar Mensagem via WhatsApp</h1>

      <textarea
        placeholder="Digite os números (um por linha)"
        value={numbers}
        onChange={(e) => setNumbers(e.target.value)}
        rows={5}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <textarea
        placeholder="Digite a mensagem"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </div>
  );
}
