import React, { useState } from "react";
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";

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

interface ProviderCardsProps {
  providers: Provider[];
}

const ProviderCards: React.FC<ProviderCardsProps> = ({ providers }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);

  const handleNext = () => {
    if (currentIndex < providers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if ("touches" in e) {
      setStartX(e.touches[0].clientX);
    } else {
      setStartX(e.clientX);
    }
  };

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

  const currentProvider = providers[currentIndex];
  const [city, state] = currentProvider.formattedAddress.split(" - ").slice(-2); // Extraindo cidade e estado

  return (
    <div
      className="w-3/4 bg-white shadow-lg rounded-lg p-6 relative mt-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={() => setStartX(null)}
    >
      <img
        src={currentProvider.avatar}
        alt={`${currentProvider.firstName} ${currentProvider.lastName}`}
        className="rounded-full w-32 h-32 mx-auto mb-4"
      />
      <h2 className="text-lg font-bold text-center">
        {currentProvider.firstName} {currentProvider.lastName}
      </h2>
      <p className="text-gray-500 text-center">{currentProvider.category}</p>
      <p className="text-gray-700 text-center font-semibold">
        R$ {currentProvider.pricePerHour}/hora
      </p>
      <div className="flex justify-center mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <FaStar
            key={i}
            color={i < Math.ceil(currentProvider.ratingStats.averageRating) ? "#FFD700" : "#ccc"}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {currentProvider.ratingStats.averageRating.toFixed(1)} (
          {currentProvider.ratingStats.totalRatings} avaliações)
        </span>
      </div>
      <p className="text-gray-500 text-center mt-2 flex items-center justify-center gap-2">
        <FaMapMarkerAlt /> {city.trim()}, {state.trim()}
      </p>
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="bg-gray-300 px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === providers.length - 1}
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600 transition"
        >
          Próximo
        </button>
      </div>
    </div>
  );
};

export default ProviderCards;
