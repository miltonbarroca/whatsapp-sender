import React, { useState } from "react";
import "./PhoneNumbers.scss";

export default function PhoneNumbers() {
  const [numbers, setNumbers] = useState("");

  // Transformar os números colados em um array limpo
  const numbersArray = numbers
    .split("\n")
    .map((n) => n.replace(/\D/g, "")) // só números
    .filter((n) => n !== "");

  const handleClear = () => setNumbers("");

  return (
    <div className="phone-card">
      <div className="phone-header">
        <h2>Números de Telefone</h2>
        <p>Cole os números aqui (um por linha) no formato: +5511999999999</p>
      </div>

      <textarea
        placeholder="+5511999999999"
        value={numbers}
        onChange={(e) => setNumbers(e.target.value)}
      />

      <div className="phone-footer">
        <span>{numbersArray.length} números detectados</span>
        <button
          className="clear-btn"
          onClick={handleClear}
          disabled={numbersArray.length === 0}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
