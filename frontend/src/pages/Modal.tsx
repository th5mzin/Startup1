import React, { useState, useEffect } from "react";
import "./Modal.css";
import PaymentForm from "./PaymentForm";
import axios from "axios";
import { notifySuccess, notifyError } from "../utils/notifications";
interface Provider {
  _id: string; // Identificador único do provedor
  firstName: string;
  lastName: string;
  category: string;
  email: string;
  pricePerHour: number;
  formattedAddress: string; // Contém city, state, country
  providerId: string;
  location: {
    lat: number; // Latitude do provedor
    lng: number; // Longitude do provedor
  };
  ratingStats: {
    averageRating: number;
    totalRatings: number;
  };
  servicesCompleted: number;
  avatar: string;
  isBusy: boolean;
}



interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvider: Provider | null;
  totalPrice: number;
  userAddress: string;
  userLocation: { lat: number | null; lng: number | null };
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  selectedProvider,
  totalPrice,
  userLocation,
}) => {
  const [calculatedPrice, setCalculatedPrice] = useState(totalPrice);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>("07:00");
  const [endTime, setEndTime] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [userAddress, setUserAddress] = useState<string>("");

  useEffect(() => {
    if (selectedProvider) {
      calculateTotalPrice(selectedHours);
      updateEndTime();
    }
  }, [selectedProvider, selectedHours, startTime]);

  const calculateTotalPrice = (numHours: number) => {
    setCalculatedPrice(
      selectedProvider ? selectedProvider.pricePerHour * numHours : 0
    );
  };

  const updateEndTime = () => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const newEndHour = startHour + selectedHours;

    if (newEndHour > 19) {
      setError("O horário máximo é até 19:00.");
      setEndTime("");
    } else {
      setError("");
      setEndTime(
        `${newEndHour.toString().padStart(2, "0")}:${startMinute
          .toString()
          .padStart(2, "0")}`
      );
    }
  };
  // Definindo o tipo para as chaves do objeto de abreviações de estado
type StateName = 
| "Acre"
| "Alagoas"
| "Amapá"
| "Amazonas"
| "Bahia"
| "Ceará"
| "Distrito Federal"
| "Espírito Santo"
| "Goiás"
| "Maranhão"
| "Mato Grosso"
| "Mato Grosso do Sul"
| "Minas Gerais"
| "Pará"
| "Paraíba"
| "Paraná"
| "Pernambuco"
| "Piauí"
| "Rio de Janeiro"
| "Rio Grande do Norte"
| "Rio Grande do Sul"
| "Rondônia"
| "Roraima"
| "Santa Catarina"
| "São Paulo"
| "Sergipe"
| "Tocantins";

// Definindo o objeto de abreviações de estado
const stateAbbreviations: Record<StateName, string> = {
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
const handleConfirmRequest = async () => {
  if (!selectedHours) {
    notifyError("Por favor, selecione um número de horas.");
    return;
  }

  if (!startTime || !endTime) {
    notifyError("Selecione o horário de início e fim.");
    return;
  }

  if (!selectedProvider) {
    notifyError("Prestador de serviço não selecionado.");
    return;
  }

  if (!userAddress || !userLocation.lat || !userLocation.lng) {
    notifyError("Preencha o endereço completo e verifique as coordenadas.");
    return;
  }

  // Dividindo e validando o endereço no formato esperado
  const addressParts = userAddress.split(" - ");
  if (addressParts.length < 5) {
    notifyError(
      "Endereço inválido. Use o formato: CEP - Rua, Número, Bairro - Cidade - Estado - País."
    );
    return;
  }

  const [zipCode, streetDetails, city, state, country] = addressParts;
  const streetParts = streetDetails.split(",").map((part) => part.trim());
  if (streetParts.length < 3) {
    notifyError("Endereço inválido. Rua, Número e Bairro devem estar separados por vírgulas.");
    return;
  }

  // Construindo o objeto de endereço
  const street = streetParts[0];
  const houseNumber = streetParts[1] || "0";
  const neighborhood = streetParts[2];

  const address = {
    zipCode: zipCode.trim(),
    street: street.trim(),
    houseNumber: houseNumber.trim(),
    neighborhood: neighborhood.trim(),
    city: city.trim(),
    state: state.trim(),
    country: country.trim(),
  };

  // Verificando se há dados faltantes no endereço
  if (!address.city || !address.state || !address.country) {
    notifyError("Endereço incompleto. Verifique os campos Cidade, Estado e País.");
    return;
  }

  // Construindo o payload para o backend
  const requestPayload = {
    providerId: selectedProvider.providerId, // Incluindo o providerId
    category: selectedProvider.category,
    pricePerHour: selectedProvider.pricePerHour,
    totalHours: selectedHours,
    totalPrice: calculatedPrice,
    address: address,
    location: userLocation,
    schedule: {
      startTime: new Date(`1970-01-01T${startTime}:00`).toISOString(),
      endTime: new Date(`1970-01-01T${endTime}:00`).toISOString(),
    },
  };
  

  console.log("Payload da solicitação:", requestPayload);

  const token = localStorage.getItem("token");
  if (!token) {
    notifyError("Você precisa estar logado.");
    return;
  }

  try {
    const response = await axios.post("http://localhost:5000/api/requests/create", requestPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 201) {
      notifySuccess("Solicitação criada com sucesso!");
      setShowPaymentForm(true);
      onClose();
    }
  } catch (error) {
    console.error("Erro ao criar solicitação:", error);
  }
};
const handleAutoLocate = () => {
  if (!navigator.geolocation) {
    notifyError("Geolocalização não é suportada pelo seu navegador.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );

        const { address } = response.data;
        if (address) {
          const houseNumber = address.house_number || "0";
          const neighborhood = address.neighbourhood || "Centro";
          const stateAbbreviation =
  address.state && address.state in stateAbbreviations
    ? stateAbbreviations[address.state as StateName]
    : address.state || "";

setUserAddress(
  `${address.postcode || ""} - ${address.road || ""}, ${houseNumber}, ${neighborhood} - ${address.city || ""} - ${stateAbbreviation} - ${address.country || ""}`
);

          notifySuccess("Localização preenchida automaticamente!");
        } else {
          notifyError("Erro ao formatar o endereço.");
        }
      } catch (error) {
        console.error("Erro ao obter endereço:", error);
        notifyError("Erro ao obter endereço. Tente novamente.");
      }
    },
    () => {
      notifyError("Não foi possível obter a localização.");
    }
  );
};
  if (!isOpen || !selectedProvider) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {selectedProvider.firstName} {selectedProvider.lastName}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <span className="close-icon">X</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="provider-details-container">
            <div className="provider-details">
              <h3>Detalhes do Prestador</h3>
              <p>
                <strong>Categoria:</strong> {selectedProvider.category}
              </p>
              <p>
              <strong>Localização:</strong>{" "}
{selectedProvider.formattedAddress 
  ? selectedProvider.formattedAddress 
  : "Localização não disponível"} 
              </p>
              <p>
                <strong>Avaliação:</strong>{" "}
                {selectedProvider.ratingStats.averageRating.toFixed(1)} estrelas (
                {selectedProvider.ratingStats.totalRatings} avaliações)
              </p>
            </div>

            <div className="price-summary">
              <p>
                <strong>Preço por Hora:</strong> R${" "}
                {selectedProvider.pricePerHour.toFixed(2)}
              </p>
              <p>
                <strong>Total:</strong> R$ {calculatedPrice.toFixed(2)}
              </p>
              {error && <p className="error-message">{error}</p>}
            </div>
          </div>

          <div className="user-address">
            <h3>Endereço do Usuário</h3>
            <button onClick={handleAutoLocate} className="auto-locate-btn">
              Usar Minha Localização
            </button>
            <input
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="Digite seu endereço completo"
              className="user-address-input"
            />
          </div>

          <div className="time-selection">
            <label htmlFor="hours">Selecione o Número de Horas:</label>
            <select
              id="hours"
              value={selectedHours}
              onChange={(e) => setSelectedHours(Number(e.target.value))}
            >
              <option value={0}>Selecione horas</option>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((hour) => (
                <option key={hour} value={hour}>
                  {hour} hora{hour > 1 ? "s" : ""}
                </option>
              ))}
            </select>

            <label htmlFor="start-time">Selecione o Horário de Início:</label>
            <select
              id="start-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {Array.from({ length: 13 }, (_, i) => `${7 + i}:00`).map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
                       </select>
          </div>

          {endTime && (
            <p>
              <strong>Termina às:</strong> {endTime}
            </p>
          )}

          <button onClick={handleConfirmRequest}>Confirmar Solicitação</button>
        </div>

        {showPaymentForm && (
          <PaymentForm
            totalPrice={calculatedPrice}
            onConfirmPayment={() =>
              notifySuccess("Pagamento realizado com sucesso!")
            }
            onClose={onClose}
            selectedProvider={selectedProvider}
            selectedHours={selectedHours}
            startTime={startTime}
            endTime={endTime}
          />
        )}
      </div>
    </div>
  );
};

export default Modal;