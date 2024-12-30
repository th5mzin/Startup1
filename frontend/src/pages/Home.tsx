import React, { useState, useEffect, useCallback } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
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
}

const Home: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const fetchProviders = useCallback(async () => {
    if (!userLocation.lat || !userLocation.lng) {
      notifyError("Localização indisponível. Certifique-se de permitir acesso à localização.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/requests/providers", {
        params: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radius: 10,
        },
      });

      setProviders(response.data.providers || []);
      if (response.data.providers.length === 0) {
        notifyError("Nenhum prestador encontrado para os critérios selecionados.");
      } else {
        notifySuccess("Prestadores carregados com sucesso!");
      }
    } catch (error) {
      notifyError("Erro ao buscar prestadores. Verifique sua conexão ou tente novamente mais tarde.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

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
        const formattedAddress = `${address.city || ""}, ${address.state || ""}`;
        setAddress(formattedAddress);
        notifySuccess("Endereço atualizado com sucesso!");
      }
    } catch (error) {
      notifyError("Erro ao obter endereço a partir da localização.");
      console.error(error);
    }
  };

  const getGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchAddressFromCoordinates(latitude, longitude);
        notifySuccess("Localização obtida com sucesso!");
      },
      (error) => {
        notifyError("Não foi possível obter sua localização.");
        console.error(error);
      }
    );
  };

  useEffect(() => {
    getGeolocation();
  }, []);

  useEffect(() => {
    if (userLocation.lat && userLocation.lng) {
      fetchProviders();
    }
  }, [userLocation, fetchProviders]);

  return (
    <div className="home-container">
      <header className="minimal-header">
        <img src="/images/logo.svg" alt="ProFix" className="logo" />
        {!isLoggedIn && (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="login-button"
          >
            Login
          </button>
        )}
      </header>

      <div className="location-section">
        <button onClick={getGeolocation} className="location-button">
          <FaMapMarkerAlt />
          Usar Minha Localização
        </button>
        <p className="location-address">{address || "Endereço não definido"}</p>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : providers.length > 0 ? (
        <ProviderCards providers={providers} />
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
