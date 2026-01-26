import React, { useState, useEffect } from "react";
import TermsModal from "./TermsModal.jsx";
import "./Footer.scss";

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <footer className="app-footer">
      <div className="footer-left">© {new Date().getFullYear()} WhatsApp Sender</div>
      <div className="footer-right">
        <button className="link-btn" onClick={() => setShowTerms(true)}>Termos de Uso</button>
      </div>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </footer>
  );
}