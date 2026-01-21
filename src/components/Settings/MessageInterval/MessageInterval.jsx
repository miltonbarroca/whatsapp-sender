import React from "react";
import { Clock, Timer, AlertCircle, CheckCircle } from "lucide-react";
import "./MessageInterval.scss";

const PRESETS = [
  { label: "Rápido", value: 60 },
  { label: "Moderado", value: 120 },
  { label: "Seguro", value: 180 },
];

export default function MessageInterval({
  value,
  onChange,
  totalMessages = 0,
  randomize,
  setRandomize,
  randomVariation,
  setRandomVariation
}) {

  const handleInputChange = (e) => {
    const newValue = Math.max(60, parseInt(e.target.value) || 60);
    onChange(newValue);
  };

  const handleSliderChange = (e) => {
    const newValue = Math.max(60, parseInt(e.target.value) || 60);
    onChange(newValue);
  };

  const handlePresetClick = (presetValue) => {
    onChange(presetValue);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };

  const getRisk = (seconds) => {
    if (seconds < 90) return { color: "warning", label: "Atenção", Icon: AlertCircle };
    if (seconds < 150) return { color: "moderate", label: "Moderado", Icon: CheckCircle };
    return { color: "success", label: "Seguro", Icon: CheckCircle };
  };

  const calculateTotalTime = () => {
    if (!totalMessages) return null;
    let avg = value;
    if (randomize) avg = value;
    const totalSec = avg * totalMessages;
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const risk = getRisk(value);

  return (
    <div className="message-interval-card">
      {/* Header */}
      <div className="message-interval-header">
        <div className="header-left">
          <div className="icon-wrapper"><Clock /></div>
          <div>
            <h3>Intervalo entre mensagens</h3>
            <p>Configure o tempo de espera</p>
          </div>
        </div>
        <div className={`risk-badge ${risk.color}`}>
          <risk.Icon />
          {risk.label}
        </div>
      </div>

      {/* Presets */}
      <div className="message-interval-presets">
        <div className="preset-label">Presets rápidos</div>
        <div className="preset-buttons">
          {PRESETS.map(preset => (
            <button
              key={preset.value}
              className={value === preset.value ? "active" : ""}
              onClick={() => handlePresetClick(preset.value)}
            >
              <span>{preset.label}</span>
              <span>{formatTime(preset.value)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Intervalo personalizado */}
      <div className="message-interval-custom">
        <div className="custom-header">
          <label>Intervalo personalizado</label>
          <div>
            <input type="number" min={60} value={value} onChange={handleInputChange} />
            <span>seg</span>
          </div>
        </div>
        <div className="slider-wrapper">
          <input type="range" min={60} max={300} step={5} value={value} onChange={handleSliderChange} />
          <div className="slider-labels">
            <span>60s</span>
            <span>{formatTime(value)}</span>
            <span>5min</span>
          </div>
        </div>
      </div>

      {/* Intervalo variável */}
      <div className="message-interval-random">
        <div className="random-header">
          <label htmlFor="randomize">Intervalo variável (mais humano)</label>
          <input
            type="checkbox"
            id="randomize"
            checked={randomize}
            onChange={() => setRandomize(!randomize)}
          />
        </div>

        {randomize && (
          <div className="random-slider">
            <div className="variation-info">
              <span>Variação</span>
              <span>±{randomVariation}s</span>
            </div>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={randomVariation}
              onChange={(e) => setRandomVariation(parseInt(e.target.value))}
            />
            <p>
              Intervalo varia entre {formatTime(Math.max(60, value - randomVariation))} e {formatTime(value + randomVariation)}
            </p>
          </div>
        )}
      </div>

      {/* Tempo total estimado */}
      {totalMessages > 0 && (
        <div className="message-interval-total">
          <div className="total-label">
            <AlertCircle />
            <p className="label-text">Tempo estimado</p>
          </div>
          <div>
            <div className="total-value">{calculateTotalTime()}</div>
            <div className="total-subtext">{totalMessages} mensagens</div>
          </div>
        </div>
      )}
    </div>
  );
}
