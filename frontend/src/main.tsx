import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Importando o BrowserRouter para navegação
import App from './App'; // Importando o App

const rootElement = document.getElementById('root') as HTMLElement;

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Router> {/* Envolvendo o App com o Router */}
      <App />
    </Router>
  </React.StrictMode>
);
