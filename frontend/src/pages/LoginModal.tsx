import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginModal.css";
import { notifySuccess, notifyError } from "../utils/notifications";
import { FaMapMarkerAlt, FaEye, FaEyeSlash } from "react-icons/fa";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  setIsLoggedIn: (value: boolean) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  setIsLoggedIn,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    cpf: "",
    firstName: "",
    lastName: "",
    fullAddress: "",
    role: "user",
    category: "",
    pricePerHour: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const categories = [
    "Serviços Residenciais",
    "Mecânico",
    "Beleza e Saúde",
    "Pintura",
    "Segurança Privada",
    "Motorista Particular",
    "Eletricista",
    "Faz-Tudo",
    "Outro",
  ];

  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]+/g, ""); // Remove tudo que não é número
  
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  
    let sum = 0;
    let remainder;
  
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
  
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
  
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.substring(10, 11));
  };
  
  const formatCPF = (cpf: string): string => {
    // Remove todos os caracteres que não sejam dígitos
    cpf = cpf.replace(/[^\d]/g, "");
    // Formata o CPF para o padrão 000.000.000-00
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };
  
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    if (name === "cpf") {
      const formattedCPF = formatCPF(value); // Formata o CPF
      setFormData((prevData) => ({
        ...prevData,
        [name]: formattedCPF,
      }));
  
      if (!validateCPF(formattedCPF)) {
        notifyError("CPF inválido. Verifique e tente novamente.");
        return;
      }
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };
  

  if (!isOpen) return null;
  const handleAutoFillLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
  
            const address = response.data.address;
            if (!address) {
              notifyError("Endereço não encontrado. Preencha manualmente.");
              return;
            }
  
            const stateName = address.state || "Estado Desconhecido";
            const stateAbbreviation = stateAbbreviations[stateName] || stateName;
  
            // Separar Rua, Número e Bairro
            const streetDetails = `${address.road || "Rua Desconhecida"}, ${address.house_number || "0"}, ${address.suburb || address.neighbourhood || "Bairro Desconhecido"}`;
            const fullAddress = `${address.postcode || "00000-000"} - ${streetDetails} - ${
              address.city || address.town || "Cidade Desconhecida"
            } - ${stateAbbreviation} - ${address.country || "Brasil"}`;
  
            setFormData((prevData) => ({
              ...prevData,
              fullAddress,
            }));
  
            notifySuccess("Endereço preenchido automaticamente.");
          } catch {
            notifyError("Erro ao buscar localização.");
          }
        },
        () => {
          notifyError("Permissão de localização negada.");
        }
      );
    } else {
      notifyError("Geolocalização não suportada.");
    }
  };   
  const stateAbbreviations: Record<string, string> = {
    "Acre": "AC",
    "Alagoas": "AL",
    "Amapá": "AP",
    "Amazonas": "AM",
    "Bahia": "BA",
    "Ceará": "CE",
    "Distrito Federal": "DF",
    "Espírito Santo": "ES",
    "Goiás": "GO",
    "Maranhão": "MA",
    "Mato Grosso": "MT",
    "Mato Grosso do Sul": "MS",
    "Minas Gerais": "MG",
    "Pará": "PA",
    "Paraíba": "PB",
    "Paraná": "PR",
    "Pernambuco": "PE",
    "Piauí": "PI",
    "Rio de Janeiro": "RJ",
    "Rio Grande do Norte": "RN",
    "Rio Grande do Sul": "RS",
    "Rondônia": "RO",
    "Roraima": "RR",
    "Santa Catarina": "SC",
    "São Paulo": "SP",
    "Sergipe": "SE",
    "Tocantins": "TO",
  };
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      // Divisão do endereço baseado no separador principal (hífen `-`)
      const addressParts = formData.fullAddress.split(" - ");
      console.log("Partes do endereço:", addressParts);
  
      if (addressParts.length !== 5) {
        notifyError(
          "Endereço inválido. Use o formato: CEP - Rua, Número, Bairro - Cidade - Estado - País."
        );
        setIsLoading(false);
        return;
      }
  
      const [zipCode, streetDetails, city, state, country] = addressParts;
  
      // Separar Rua, Número e Bairro
      const streetParts = streetDetails.split(",").map((part) => part.trim());
      if (streetParts.length < 3) {
        notifyError("Endereço inválido. Rua, Número e Bairro devem estar separados por vírgulas.");
        setIsLoading(false);
        return;
      }
  
      const street = streetParts[0]; // Rua
      const houseNumber = streetParts[1]; // Número
      const neighborhood = streetParts[2]; // Bairro
  
      if (
        !zipCode ||
        !street ||
        !houseNumber ||
        !neighborhood ||
        !city ||
        !state ||
        !country
      ) {
        notifyError("Endereço incompleto. Certifique-se de preencher todos os campos.");
        setIsLoading(false);
        return;
      }
  
      const stateAbbreviation = stateAbbreviations[state.trim()] || state.trim();
  
      // Formatar CPF antes de enviar
      const formattedCPF = formatCPF(formData.cpf);
  
      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        cpf: formattedCPF, // CPF formatado no padrão 000.000.000-00
        category: formData.role === "service-provider" ? formData.category : undefined,
        pricePerHour:
          formData.role === "service-provider"
            ? parseFloat(formData.pricePerHour)
            : undefined,
        address: {
          zipCode: zipCode.trim(),
          street: street.trim(),
          houseNumber: houseNumber.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: stateAbbreviation,
          country: country.trim(),
        },
      };
  
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        dataToSend,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      if (response.status === 201 || response.status === 200) {
        notifySuccess("Registro realizado com sucesso!");
        setIsLogin(true); // Retorna para a tela de login
      } else {
        notifyError("Erro ao registrar usuário. Por favor, tente novamente.");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        notifyError(error.response.data.message || "Erro ao registrar usuário.");
      } else {
        notifyError("Erro ao registrar usuário.");
      }
    } finally {
      setIsLoading(false);
    }
  };        
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dataToSend = {
        email: formData.email,
        password: formData.password,
      };

      const response = await axios.post("http://localhost:5000/api/auth/login", dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setIsLoggedIn(true);
        onLoginSuccess();
        onClose();
        navigate("/profile");
        notifySuccess("Login realizado com sucesso!");
      } else {
        notifyError("Erro ao realizar login. Verifique suas credenciais.");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        notifyError(error.response.data.message || "Erro ao realizar login.");
      } else {
        notifyError("Erro ao realizar login.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLoginRegister = () => {
    setIsLogin((prev) => !prev);
    clearForm();
  };

  const clearForm = () => {
    setFormData({
      email: "",
      password: "",
      cpf: "",
      firstName: "",
      lastName: "",
      fullAddress: "",
      role: "user",
      category: "",
      pricePerHour: "",
    });
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={handleClose}>
          &times;
        </button>
        <h2>{isLogin ? "Login" : "Registro"}</h2>
        <form onSubmit={isLogin ? handleLogin : handleRegister}>
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
  placeholder="CPF (000.000.000-00)"
  value={formData.cpf}
  onChange={handleChange}
  required
/>

              <div className="address-container">
                <input
                  type="text"
                  name="fullAddress"
                  placeholder="Endereço completo"
                  value={formData.fullAddress}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="location-btn" onClick={handleAutoFillLocation}>
                  <FaMapMarkerAlt />
                </button>
              </div>
              <select name="role" value={formData.role} onChange={handleChange} required>
                <option value="user">Cliente</option>
                <option value="service-provider">Prestador de Serviço</option>
              </select>
              {formData.role === "service-provider" && (
                <>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="pricePerHour"
                    placeholder="Preço por hora"
                    value={formData.pricePerHour}
                    onChange={handleChange}
                    required
                  />
                </>
              )}
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
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Senha"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="button" className="password-toggle-btn" onClick={togglePasswordVisibility}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? "Carregando..." : isLogin ? "Entrar" : "Registrar"}
          </button>
        </form>
        {!isLogin && (
          <p className="terms">
            Ao se registrar, você concorda com nossos{" "}
            <a href="/terms" target="_blank">
              Termos de Uso
            </a>{" "}
            e nossa{" "}
            <a href="/privacy" target="_blank">
              Política de Privacidade
            </a>.
          </p>
        )}
        <button className="toggle-button" onClick={toggleLoginRegister}>
          {isLogin ? "Não tem uma conta? Registre-se" : "Já tem uma conta? Faça login"}
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
