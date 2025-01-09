import React, { useState } from "react";
import { FaStar, FaMapMarkerAlt, FaComments, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "./ProviderCards.css";

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
  providerId: string; // Adiciona providerId aqui
}

interface ProviderCardsProps {
  providers: Provider[];
  onChatOpen: (providerId: string) => void; // Callback para abrir o chat
}

const ProviderCards: React.FC<ProviderCardsProps> = ({ providers, onChatOpen }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);

  // Navegação para o próximo card
  const handleNext = () => {
    if (currentIndex < providers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Navegação para o card anterior
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Captura o início do swipe (toque ou mouse)
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if ("touches" in e) {
      setStartX(e.touches[0].clientX);
    } else {
      setStartX(e.clientX);
    }
  };

  // Captura o movimento do swipe e realiza a navegação
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!startX) return;

    let endX = 0;
    if ("touches" in e) {
      endX = e.touches[0].clientX;
    } else {
      endX = e.clientX;
    }

    const deltaX = startX - endX;

    if (deltaX > 50) {
      handleNext();
      setStartX(null);
    } else if (deltaX < -50) {
      handlePrevious();
      setStartX(null);
    }
  };

  // Verifica se há provedores disponíveis
  if (!providers.length) {
    return <p className="no-providers-text">Nenhum provedor disponível no momento.</p>;
  }

  // Provedor atual
  const currentProvider = providers[currentIndex];

  return (
    <div className="provider-cards-container">
      {/* Setas para navegação no mobile */}
      <button
        className="arrow-button arrow-left"
        onClick={handlePrevious}
        disabled={currentIndex === 0}
      >
        <FaArrowLeft />
      </button>
      <button
        className="arrow-button arrow-right"
        onClick={handleNext}
        disabled={currentIndex === providers.length - 1}
      >
        <FaArrowRight />
      </button>

      {/* Card atual */}
      <div
        className={`provider-card ${startX ? "swipe-mobile" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={() => setStartX(null)}
      >
        <img
          src={currentProvider.avatar}
          alt={`${currentProvider.firstName} ${currentProvider.lastName}`}
          className="provider-avatar"
        />
        <h2 className="provider-name">
          {currentProvider.firstName} {currentProvider.lastName}
        </h2>
        <p className="provider-category">{currentProvider.category}</p>
        <p className="provider-price">R$ {currentProvider.pricePerHour}/hora</p>
        <div className="provider-rating">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              color={i < Math.ceil(currentProvider.ratingStats.averageRating) ? "#FFD700" : "#ccc"}
            />
          ))}
          <span className="provider-rating-stats">
            {currentProvider.ratingStats.averageRating.toFixed(1)} (
            {currentProvider.ratingStats.totalRatings} avaliações)
          </span>
        </div>
        <p className="provider-address">
          <FaMapMarkerAlt /> {currentProvider.formattedAddress}
        </p>
        <button
          className="provider-chat-button"
          onClick={() => onChatOpen(currentProvider.providerId)}
        >
          <FaComments /> Abrir Chat
        </button>
      </div>

      {/* Botões de navegação no desktop */}
      <div className="navigation-buttons">
        <button
          className="navigation-button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          Anterior
        </button>
        <button
          className="navigation-button"
          onClick={handleNext}
          disabled={currentIndex === providers.length - 1}
        >
          Próximo
        </button>
      </div>
    </div>
  );
};

export default ProviderCards;
