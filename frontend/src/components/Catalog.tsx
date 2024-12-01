import { FaCrown, FaStar } from "react-icons/fa";

type Service = {
  title: string;
  price: string;
  provider: string;
  location: string;
  description: string;
  rating: number;
  reviewsCount: number;
  isPromoted: boolean;
  images: { src: string; alt: string }[];
};

const Catalog = ({ services }: { services: Service[] }) => {
  return (
    <section className="filter-and-catalog">
      <h2>Popular Services</h2>
      <div className="services-grid">
        {services.map((service, index) => (
          <div className="service-card" key={index}>
            {service.isPromoted && (
              <div className="badge">
                <FaCrown style={{ color: "#FFD700", fontSize: "1.5rem" }} />
              </div>
            )}
            <div className="service-image-gallery">
              {service.images.map((image, idx) => (
                <img key={idx} src={image.src} alt={image.alt} className="service-image" />
              ))}
            </div>
            <div className="service-info">
              <h3>{service.title}</h3>
              <p className="service-price">{service.price}</p>
              <p className="service-location">{service.location}</p>
              <p className="service-description">{service.description}</p>
              <p className="service-name">{service.provider}</p>

              <div className="stars">
                {[...Array(5)].map((_, idx) => (
                  <FaStar key={idx} color={idx < service.rating ? "gold" : "lightgray"} />
                ))}
                <span className="rating-count">
                  {service.rating} ({service.reviewsCount.toLocaleString()})
                </span>
              </div>

              <div className="button-container">
                <button className="service-btn">Hire Now</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Catalog;
