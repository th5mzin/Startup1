import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Importando o BrowserRouter para navegação
import App from './App'; // Importando o App

const rootElement = document.getElementById('root') as HTMLElement;

const root = ReactDOM.createRoot(rootElement);
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .then((registration) => {
      console.log("Service Worker registrado com sucesso:", registration);
    })
    .catch((error) => {
      console.error("Erro ao registrar Service Worker:", error);
    });
}
root.render(
  <React.StrictMode>
    <Router> {/* Envolvendo o App com o Router */}
      <App />
    </Router>
  </React.StrictMode>
);
