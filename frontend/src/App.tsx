import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Para rotas
import Home from './pages/Home'; // Importe o componente Home
import './styles/styles.css';
const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Removi as rotas para About e Contact */}
      </Routes>
    </div>
  );
};

export default App;
