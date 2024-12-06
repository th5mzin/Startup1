import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';

const countries = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CA', name: 'Canadá' },
  { code: 'FR', name: 'França' },
  { code: 'DE', name: 'Alemanha' },
];

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  setIsLoggedIn: (value: boolean) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, setIsLoggedIn }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    cpf: '',
    firstName: '',
    lastName: '',
    country: '',
    city: '',
    state: '',
    role: 'service-provider',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const url = isLogin
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/register';
      const response = await axios.post(url, formData);

      if (!isLogin) {
        // Se for registro, faça login automaticamente após o registro
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: formData.email,
          password: formData.password,
        });

        if (loginResponse.data.token) { // Verifique se o token está presente
          localStorage.setItem('token', loginResponse.data.token);
          setIsLoggedIn(true);
          onLoginSuccess();
          onClose(); // Fecha o modal
          navigate('/'); // Redireciona para a página inicial
        } else {
          setErrorMessage('Erro ao registrar o usuário.');
        }
      } else {
        // Se for login
        if (response.data.token) { // Verifique se o token está presente
          localStorage.setItem('token', response.data.token);
          setIsLoggedIn(true);
          onLoginSuccess();
          onClose(); // Fecha o modal
          navigate('/'); // Redireciona para a página inicial
        } else {
          setErrorMessage('Erro ao fazer login.');
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMessage(error.response?.data?.message || 'Erro ao registrar ou fazer login.');
      } else {
        setErrorMessage('Erro ao registrar ou fazer login.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginRegister = () => {
    setIsLogin((prev) => !prev);
    clearForm(); // Limpa o formulário ao alternar
  };

  const clearForm = () => {
    setFormData({
      email: '',
      password: '',
      cpf: '',
      firstName: '',
      lastName: '',
      country: '',
      city: '',
      state: '',
      role: 'service-provider',
    });
    setErrorMessage(''); // Limpa a mensagem de erro
  };

  const handleClose = () => {
    clearForm(); // Limpa o formulário ao fechar
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isLogin ? 'Login' : 'Registro'}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="Nome"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Sobrenome"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="cpf"
                placeholder="CPF"
                value={formData.cpf}
                onChange={handleChange}
                required
              />
              <select name="country" value={formData.country} onChange={handleChange} required>
                <option value="" disabled>
                  Selecione um país
                </option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="city"
                placeholder="Cidade"
                value={formData.city}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="state"
                placeholder="Estado (ex: SP, NY)"
                value={formData.state}
                onChange={handleChange}
                maxLength={3} // Limita a 3 caracteres
                required
              />
              <select name="role" value={formData.role} onChange={handleChange} required>
                <option value="service-provider">Prestador de Serviço</option>
                <option value="user">Cliente</option>
              </select>
            </>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? 'Carregando...' : isLogin ? 'Entrar' : 'Registrar'}
          </button>
        </form>
        <div className="terms-container">
          <p>
            Ao continuar, você concorda com nossos{' '}
            <a href="/termos-de-uso" target="_blank" rel="noopener noreferrer">Termos de Uso</a> e{' '}
            <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.
          </p>
        </div>
        <button className="toggle-button" onClick={toggleLoginRegister}>
          {isLogin ? 'Não tem uma conta? Registre-se' : 'Já tem uma conta? Faça login'}
        </button>
        <button className="close-button" onClick={handleClose}>Fechar</button>
      </div>
    </div>
  );
};

export default LoginModal;