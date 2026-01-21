import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  // Carregar preferência salva ao montar
  useEffect(() => {
    if (!window.require) return;
    const { ipcRenderer } = window.require('electron');

    ipcRenderer.invoke('load-settings').then((settings) => {
      if (settings.darkMode !== undefined) {
        setIsDark(settings.darkMode);
      }
    });
  }, []);

  // Aplicar classe ao documento
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const saveTheme = async (value) => {
    if (!window.require) return;
    const { ipcRenderer } = window.require('electron');

    try {
      // Carregar settings atuais
      const settings = await ipcRenderer.invoke('load-settings');
      // Adicionar darkMode
      await ipcRenderer.invoke('save-settings', {
        ...settings,
        darkMode: value
      });
    } catch (err) {
      console.error('Erro ao salvar tema:', err);
    }
  };

  const handleThemeToggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    saveTheme(newValue);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: handleThemeToggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
