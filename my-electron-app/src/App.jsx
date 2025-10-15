import React from "react";
import PhoneNumbers from "./components/PhoneNumbers/PhoneNumbers.jsx";
import Header from "./components/Header/Header.jsx";
import Presets from "./components/Presets/Presets.jsx";
import './styles/globals.scss';

export default function App() {
  return (
    <div>
      <Header />
      <div className="app-container">
        <Presets />
        <PhoneNumbers />
      </div>
    </div>
  );
}
