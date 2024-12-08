import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCrown, FaStar, FaMapMarkerAlt } from "react-icons/fa";

// Definindo a interface para o tipo de serviço
interface Service {
  title: string;
  pricePerHour: number;
  provider: string;
  location: {
    country: string;
    state: string;
    city: string;
  };
  description: string;
  rating: number;
  reviewsCount: number;
  isPromoted: boolean;
  images: string[];
}

const ServiceCard = React.memo(({ service }: { service: Service }) => {
  return (
    <div className="service-card">
      {service.isPromoted && (
        <div className="badge">
          <FaCrown style={{ color: "#FFD700", fontSize: "1.5rem" }} />
        </div>
      )}
      <div className="service-image-gallery">
        <img src={service.images[0]} alt="Service" className="service-image" />
      </div>
      <div className="service-info">
        <h3>{service.title}</h3>
        <p className="service-price">${service.pricePerHour}/hour</p>
        <p className="service-description">{service.description}</p>
        <p className="service-provider">
          <strong style={{ color: "blue" }}>{service.provider}</strong>
        </p>
        <div className="service-details">
          <div className="service-rating">
            {[...Array(5)].map((_, index) => (
              <FaStar key={index} color={service.rating > index ? "#FFD700" : "#ddd"} />
            ))}
            <span>({service.reviewsCount})</span>
          </div>
          <div className="service-location">
            <FaMapMarkerAlt /> {service.location.city}, {service.location.state}
          </div>
        </div>
        <button className="service-btn">Hire Now</button>
      </div>
    </div>
  );
});

const ServiceList = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar serviços da API
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5000/api/services/list'); // Substitua pela URL da sua API
      setServices(response.data); // Atualiza os serviços com os dados recebidos
    } catch (err) {
      setError('Failed to load services. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="service-list">
      <h1>Available Services</h1>
      {loading && <p>Loading services...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <div className="service-grid">
          {services.map((service, index) => (
            <ServiceCard key={index} service={service} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceList;