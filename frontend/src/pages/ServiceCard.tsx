import React from 'react'; // Importando o React
import { FaCrown, FaStar, FaMapMarkerAlt } from "react-icons/fa";

// Definindo a interface para o tipo de serviço
interface Service {
  title: string;
  price: string;
  provider: string;
  location: string;
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
        <p className="service-price">{service.price}</p>
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
            <FaMapMarkerAlt /> {service.location}
          </div>
        </div>
        <button className="service-btn">Hire Now</button>
      </div>
    </div>
  );
});

export default ServiceCard;
