import React from "react";
import PhoneNumbers from "./components/PhoneNumbers/PhoneNumbers.jsx";
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import Presets from "./components/Presets/Presets.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import './styles/globals.scss';

export default function App() {
  return (
    <ThemeProvider>
      <div>
        <Header />
        <div className="app-container">
          <Presets />
          <PhoneNumbers />
        </div>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
