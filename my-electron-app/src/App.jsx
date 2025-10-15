import React from "react";
import PhoneNumbers from "./components/PhoneNumbers/PhoneNumbers.jsx";
import Header from "./components/Header/Header.jsx";
import Presets from "./components/Presets/Presets.jsx";

export default function App() {
  return (
    <div>
      <Header />
      <Presets />
      <PhoneNumbers />
    </div>
  );
}
