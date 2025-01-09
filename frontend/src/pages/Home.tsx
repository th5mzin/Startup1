import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaUserCircle, FaSignOutAlt, FaComments } from "react-icons/fa";
import axios from "axios";
import { notifySuccess, notifyError } from "../utils/notifications";
import ProviderCards from "./ProviderCards";
import LoginModal from "./LoginModal";
import "./Home.css";

interface Provider {
  _id: string;
  firstName: string;
  lastName: string;
  category: string;
  pricePerHour: number;
  formattedAddress: string;
  avatar: string;
  ratingStats: {
    averageRating: number;
    totalRatings: number;
  };
  providerId: string;
}

const Home: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number | null;
    lng: number | null;
    city?: string;
    state?: string;
    country?: string;
  }>({
    lat: null,
    lng: null,
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setProviders([]);

    try {
      if (!address || !userLocation.lat || !userLocation.lng) {
        notifyError("Localização ou endereço incompletos. Por favor, verifique os dados.");
        return;
      }

      const addressParts = address.split(",");
      const stateAndCity = addressParts[1]?.split("-") || [];
      const state = stateAndCity[1]?.trim() || "";
      const city = stateAndCity[0]?.trim() || "";
      const country = addressParts.slice(-1)[0]?.trim() || "";

      if (!state || !city || !country) {
        notifyError("Informações de endereço incompletas para realizar a busca.");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/requests/providers", {
        params: {
          category: selectedCategory || "all",
          state,
          city,
          country,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius: 10,
        },
      });

      if (response.data.providers.length === 0) {
        notifyError("Nenhum provedor encontrado para os critérios selecionados.");
      } else {
        notifySuccess("Provedores carregados com sucesso!");
      }

      setProviders(response.data.providers || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          notifyError(
            `Erro: ${error.response.status} - ${
              error.response.data.message || "Erro ao buscar provedores."
            }`
          );
        } else if (error.request) {
          notifyError("Erro: Não houve resposta do servidor.");
        } else {
          notifyError(`Erro: ${error.message}`);
        }
      } else {
        notifyError("Erro desconhecido ao buscar provedores.");
      }
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [address, selectedCategory, userLocation]);
  const handleStartChat = async (providerId: string) => {
    if (!isLoggedIn) {
      notifyError("Você precisa estar logado para iniciar um bate-papo.");
      setIsLoginModalOpen(true);
      return;
    }
  
    try {
      const response = await axios.post(
        "http://localhost:5000/api/chats/start",
        { providerId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      if (!response.data || !response.data.id) {
        notifyError("Erro ao iniciar bate-papo: resposta inválida.");
        return;
      }
  
      const chatId = response.data.id; // Corrige para 'id' ao invés de '_id'
      notifySuccess("Bate-papo iniciado com sucesso!");
      navigate(`/chats/${chatId}`); // Redireciona para o bate-papo recém-criado
    } catch (error) {
      notifyError("Erro ao iniciar bate-papo.");
      console.error("Erro ao iniciar chat:", error);
    }
  };  
  const getGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          fetchAddressFromCoordinates(latitude, longitude);
          notifySuccess("Localização obtida com sucesso!");
        },
        (error) => {
          notifyError("Não foi possível obter sua localização. Por favor, insira manualmente.");
          console.error(error);
        }
      );
    } else {
      notifyError("Seu navegador não suporta geolocalização.");
    }
  };

  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: {
          lat,
          lon: lng,
          format: "json",
        },
      });

      if (response.data) {
        const { address } = response.data;
        const formattedAddress = `${address.road || ""}, ${
          address.city || ""
        } - ${address.state || ""}, ${address.country || ""}`;
        setAddress(formattedAddress);
        notifySuccess("Endereço atualizado com sucesso!");

        setUserLocation((prev) => ({
          ...prev,
          city: address.city,
          state: address.state,
          country: address.country,
        }));

        fetchProviders();
      }
    } catch (error) {
      notifyError("Erro ao obter endereço a partir da localização.");
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    notifySuccess("Logout realizado com sucesso!");
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate("/profile");
    } else {
      notifyError("Você precisa estar logado para acessar o perfil.");
      setIsLoginModalOpen(true);
    }
  };

  const handleChatOpen = () => {
    if (isLoggedIn) {
      navigate("/chats");
    } else {
      notifyError("Você precisa estar logado para acessar os bate-papos.");
      setIsLoginModalOpen(true);
    }
  };

  useEffect(() => {
    getGeolocation();
  }, []);

  useEffect(() => {
    if (userLocation.city && userLocation.state && userLocation.country) {
      fetchProviders();
    }
  }, [userLocation, fetchProviders]);

  return (
    <div className="home-container">
      <header className="main-header">
        <div className="header-content">
          <img src="/images/logo.svg" alt="ProFix" className="logo" />
          <div className="filters-location">
            <button onClick={getGeolocation} className="location-button">
              <FaMapMarkerAlt />
              Usar Minha Localização
            </button>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos</option>
              <option value="Serviços-Residenciais">Serviços Residenciais</option>
              <option value="Mecanico">Mecânico</option>
              <option value="Beleza-e-Saúde">Beleza e Saúde</option>
              <option value="Pintura">Pintura</option>
              <option value="Segurança-Privada">Segurança Privada</option>
              <option value="Eletricista">Eletricista</option>
              <option value="Faz-Tudo">Faz-Tudo</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          {isLoggedIn ? (
            <div className="user-actions">
              <button className="chat-button" onClick={handleChatOpen}>
                <FaComments /> Bate-Papo
              </button>
              <button className="profile-button" onClick={handleProfileClick}>
                <FaUserCircle /> Perfil
              </button>
              <button className="logout-button" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="login-button"
            >
              Login
            </button>
          )}
        </div>
      </header>

      <div className="location-section">
        <p className="location-address">{address || "Endereço não definido"}</p>
      </div>
      {loading ? (
        <div className="loading-spinner" />
      ) : providers.length > 0 ? (
        <ProviderCards providers={providers} onChatOpen={handleStartChat} />
      ) : (
        <p className="no-providers-text">Nenhum prestador disponível.</p>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setIsLoginModalOpen(false);
        }}
        setIsLoggedIn={setIsLoggedIn}
      />
    </div>
  );
};

export default Home;
