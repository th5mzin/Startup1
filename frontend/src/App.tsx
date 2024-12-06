import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Para rotas
import Home from './pages/Home'; // Importe o componente Home
import Profile from './pages/Profile'; // Importe o componente Profile
import './styles/styles.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        {/* Adicione outras rotas, se necessário */}
      </Routes>
    </div>
  );
};

export default App;
