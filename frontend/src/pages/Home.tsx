import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal";
import Modal from "./Modal";
import "../styles/styles.css";
import { FaUserAlt, FaSignOutAlt, FaSearch, FaSyncAlt, FaStar, FaCircle, FaTh, FaList, FaAngleUp, FaMapMarkerAlt } from "react-icons/fa";
import axios from "axios";
import { notifySuccess, notifyError, notifyInfo } from "../utils/notifications";

interface Provider {
  _id: string; // O _id do usuário agora é o providerId
  firstName: string;
  lastName: string;
  category: string;
  email: string;
  pricePerHour: number;
  formattedAddress: string;
  providerId: string; // Esta propriedade agora será o _id
  location: {
    lat: number;
    lng: number;
  };
  ratingStats: {
    averageRating: number;
    totalRatings: number;
  };
  servicesCompleted: number;
  avatar: string;
  isBusy: boolean;
}

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [address, setAddress] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));
  const [showModal, setShowModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const navigate = useNavigate();
  const [radius, setRadius] = useState<number>(10); // Novo estado para o filtro de raio
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleOpenModal = () => setIsOpen(true);
  const handleCloseModal = () => setIsOpen(false);

const [debouncedRadius] = useState(radius);
useEffect(() => {
  const timeout = setTimeout(() => {
    setRadius(debouncedRadius);
  }, 500);

  return () => clearTimeout(timeout);
}, [debouncedRadius]);

//const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 // setDebouncedRadius(Number(e.target.value)); // Garantir que seja numérico
//};
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    handleCloseModal();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };
  
  const openModal = (provider: Provider) => {
    console.log("Provider selecionado:", provider); // Adicione este log
    if (!address) {
      notifyError("Por favor, preencha o endereço e o número da casa antes de continuar.");
      return;
    }
    setSelectedProvider(provider);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setProviders([]); // Limpar os provedores antes de iniciar a busca.
  
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
          radius: 10,
        },
        // Não inclui o token aqui para a visualização
      });
  
      if (response.data.providers.length === 0) {
        notifyInfo("Nenhum provedor encontrado para os critérios selecionados.");
      } else {
        notifySuccess("Provedores carregados com sucesso!");
      }
  
      setProviders(response.data.providers || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          notifyError(`Erro: ${error.response.status} - ${error.response.data.message || "Erro ao buscar provedores."}`);
        } else if (error.request) {
          notifyError("Erro: Não houve resposta do servidor.");
        } else {
          notifyError(`Erro: ${error.message}`);
        }
      } else {
        notifyError("Erro desconhecido ao buscar provedores.");
      }
      setProviders([]); // Limpar provedores em caso de erro
    } finally {
      setLoading(false);
    }
  }, [address, selectedCategory, userLocation, radius]);   
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
        const formattedAddress = `${address.road || ""}, ${address.city || ""} - ${address.state || ""}, ${address.country || ""}`;
        setAddress(formattedAddress);
        notifySuccess("Endereço atualizado com sucesso!");
      }
    } catch (error) {
      notifyError("Erro ao obter endereço a partir da localização.");
      console.error(error);
    }
  };

  useEffect(() => {
    getGeolocation(); // Solicita a localização ao carregar a aplicação
  }, []);

  useEffect(() => {
    console.log("Dados recebidos da API:", providers);
  }, [providers]);

  // Atualizar provedores automaticamente ao alterar categoria, localização ou número da casa
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="container">
      <header className="header">
        <div className="logo">
          <img src="/images/logo.svg" alt="Logo" />
        </div>
        <div className="search-bar-header">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for a service provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search for a service provider"
            />
            <button onClick={fetchProviders}  className="search-btn"aria-label="Search">
              <FaSearch />
            </button>
          </div>
        </div>
        <div className="navbar">
          <ul className="nav-links">
            {!isLoggedIn ? (
              <li>
                <button className="cta-btn" onClick={handleOpenModal}>
                  Sign Up
                </button>
              </li>
            ) : (
              <>
                <li>
                  <button className="cta-btn" onClick={() => navigate("/profile")}>
                    <FaUserAlt /> Profile
                  </button>
                </li>
                <li>
                  <button className="cta-btn" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </header>

      <LoginModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        onLoginSuccess={handleLoginSuccess}
        setIsLoggedIn={setIsLoggedIn}
      />

      {showModal && selectedProvider && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          selectedProvider={selectedProvider}
          totalPrice={selectedProvider?.pricePerHour || 0}
          userLocation={userLocation}
          userAddress={address  ? `${address}` : "Endereço não definido"}
          />
        )}
  
        {showBackToTop && (
          <button className="back-to-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <FaAngleUp />
          </button>
        )}
  
        <section className="filters">
          <label htmlFor="category" className="filter-label">Category:</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="Serviços-Residenciais">Serviços Residenciais</option>
            <option value="Mecanico">Mecânico</option>
            <option value="Beleza-e-Saúde">Beleza e Saúde</option>
            <option value="Pintura">Pintura</option>
            <option value="Segurança-Privada">Segurança Privada</option>
            <option value="Eletricista">Eletricista</option>
            <option value="Faz-Tudo">Faz-Tudo</option>
            <option value="Outro">Outro</option>
          </select>
  
          <section className="location-input">
            <div className="address-container">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address"
                className="address-input"
              />
              <button onClick={getGeolocation} className="geolocation-btn">
                <FaMapMarkerAlt /> Use My Location
              </button>
            </div>
           
       
          </section>
        </section>
  
        <section id="providers" className="providers-section">
          <div className="filters-actions">
            <button onClick={fetchProviders} className="refresh-btn">
              <FaSyncAlt /> Atualizar
            </button>
            <div className="toggle-view-buttons">
              <button
                onClick={() => setViewMode("grid")}
                className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              >
                <FaTh /> Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
              >
                <FaList /> List
              </button>
            </div>
          </div>
          <div className={`providers-grid ${viewMode}-view`}>
  {loading ? (
    <p>Loading providers...</p>
  ) : providers.length > 0 ? (
    providers.map((provider, index) => {
      const rating = provider.ratingStats?.averageRating || 0;
      const formattedAddress = provider.formattedAddress || "Endereço não disponível";

      return (
        <div
          className={`provider-card ${viewMode === "list" ? "list-card" : ""}`}
          key={index}
        >
          <div className="provider-image-gallery">
            <img src={provider.avatar} alt="Provider" className="provider-image" />
          </div>
          <div className="provider-info">
            <h3 className="provider-name">
              {provider.firstName} {provider.lastName}
            </h3>
            <p className="provider-category">{provider.category}</p>
            <p className="provider-price">R$ {provider.pricePerHour}/hour</p>
            <p className="provider-address">
          {formattedAddress || "Endereço não disponível"}
        </p>
            <div className="provider-rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <FaStar
                  key={i}
                  color={i < Math.ceil(rating) ? "#FFD700" : "#ccc"}
                />
              ))}
              <span className="rating-details">
                {rating.toFixed(1)} ({provider.ratingStats?.totalRatings || 0} avaliações)
              </span>
            </div>
            <div className="provider-status">
              <FaCircle color={provider.isBusy ? "red" : "green"} />{" "}
              {provider.isBusy ? "Ocupado" : "Online"}
            </div>
          </div>
          <button
            onClick={() => openModal(provider)}
            className="provider-btn request-button"
          >
            Request Service
          </button>
        </div>
      );
    })
  ) : (
    <p style={{ textAlign: "center", margin: "20px 0", color: "#757575" }}>
      No providers found.
    </p>
  )}
</div>
      </section>
    </div>
  );
};

export default Home;