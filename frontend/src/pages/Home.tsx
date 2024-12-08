import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import LoginModal from './LoginModal';
import Modal from "./Modal";
import "../styles/styles.css";
import {
  FaHome,
  FaTools,
  FaBox,
  FaPaintBrush,
  FaMedkit,
  FaCar,
  FaShieldAlt,
  FaUserAlt,
  FaClipboardList,
  FaCrown,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaWrench,
  FaSearch,
  FaStar,
  FaAngleUp,
  FaAngleDown
} from "react-icons/fa";

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
  category: string;
}

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    priceRange: "",
    rating: "",
    date: "",
  });
  const [locationQuery, setLocationQuery] = useState({
    country: "Brazil",
    state: "",
    city: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    handleCloseModal();
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove o token do localStorage
    setIsLoggedIn(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim() === "") {
      return;
    }
    console.log("Search for:", searchQuery);
  };

  const openModal = (service: Service) => {
    setSelectedService(service);
    setTotalPrice(parseFloat(service.price.replace("$", "").replace("/hour", "")));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleCountryChange = (country: string) => {
    setLocationQuery({ ...locationQuery, country, state: "", city: "" });

    if (country === "Brazil") {
      setAvailableStates(["SP", "RJ", "MG"]);
      setAvailableCities(["São Paulo", "Rio de Janeiro", "Belo Horizonte"]);
    } else if (country === "USA") {
      setAvailableStates(["CA", "NY", "TX"]);
      setAvailableCities(["Los Angeles", "New York", "Austin"]);
    } else if (country === "Canada") {
      setAvailableStates(["ON", "QC", "BC"]);
      setAvailableCities(["Toronto", "Montreal", "Vancouver"]);
    } else {
      setAvailableStates([]);
      setAvailableCities([]);
    }
  };

  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShowBackToTop(true);
    } else {
      setShowBackToTop(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const services = Array(12).fill({
    title: "Electrical Repairs",
    price: "$50/hour",
    provider: "John Doe",
    location: "São Paulo, SP",
    description: "Get your electrical issues fixed by professionals.",
    rating: 4.5,
    reviewsCount: 10000,
    isPromoted: true,
    images: ["/images/service1.jpg", "/images/service2.jpg", "/images/service3.jpg"],
  });

  const categories = [
    { name: "Home Services", icon: <FaHome /> },
    { name: "Mechanic", icon: <FaWrench /> },
    { name: "Beauty & Health", icon: <FaMedkit /> },
    { name: "Painting", icon: <FaPaintBrush /> },
    { name: "Private Security", icon: <FaShieldAlt /> },
    { name: "Private Driver", icon: <FaCar /> },
    { name: "Electrician", icon: <FaTools /> },
    { name: "Handyman", icon: <FaClipboardList /> },
    { name: "Other", icon: <FaUserAlt /> },
  ];

  return (
    <div className="container">
  <div className="container">
  <header className="header">
    {/* Logo */}
    <div className="logo">
  <img src="/images/logo.svg" alt="Logo" />
</div>

    {showBackToTop && (
      <button
        className="back-to-top-btn"
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <FaAngleUp />
      </button>
    )}

    {/* Barra de Pesquisa */}
    <div className="search-bar-header">
      <div className="search-bar" onClick={() => setSearchExpanded(!searchExpanded)}>
        <input
          type="text"
          placeholder="Search for a service..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          aria-label="Search for a service"
        />
        <button onClick={handleSearch} className="search-btn" aria-label="Search">
          <FaSearch />
        </button>
      </div>
    </div>

    {/* Botão de Signup */}
    {!isLoggedIn && (
      <div className="signup-container">
        <button className="cta-btn" onClick={handleOpenModal}>
          Sign Up
        </button>
      </div>
    )}

    {/* Navbar (Menu) */}
    {isLoggedIn && (
      <div className="navbar">
        <ul className="nav-links">
          <li>
            <button className="cta-btn" onClick={() => navigate("/profile")}>
              <FaUserAlt /> Profile
            </button>
          </li>
          <li>
            <a href="#services">
              <FaBox /> Services
            </a>
          </li>
          <li>
            <a onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </a>
          </li>
        </ul>
      </div>
    )}
  </header>
</div>


      {/* Modal de Login/Registro */}
      <LoginModal 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        onLoginSuccess={handleLoginSuccess} 
        setIsLoggedIn={setIsLoggedIn} 
      />
      
      {/* Navbar (Menu de Categorias) */}
      <div className="categories-navbar">
        <nav className="categories-nav">
          <div className="categories-scroll">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`category-btn ${selectedCategory === category.name.toLowerCase() ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(category.name.toLowerCase())}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Modal */}
      {showModal && selectedService && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          onConfirm={() => {
            console.log("Service confirmed:", selectedService);
            closeModal();
          }}
          selectedService={selectedService}
          totalPrice={totalPrice}
        />
      )}

      {/* Filters and Location Section */}
      <section className="filters-location-section">
        <button
          className="toggle-filters-btn"
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          aria-label="Toggle Filters"
        >
          {isFiltersVisible ? <FaAngleUp /> : <FaAngleDown />} Filters
        </button>

        {isFiltersVisible && (
          <div className="filters-container">
            {/* Price Range Filter */}
            <div className="filter">
              <label>Price Range</label>
              <div className="price-slider">
                <input
                  type="range"
                  min="0"
                  max="500" value={filters.priceRange || 100}
                  onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                  className="slider"
                />
                <div className="price-labels">
                  <span>$0</span>
                  <span>${filters.priceRange || 100}</span>
                  <span>$500</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="filter">
              <label>Rating</label>
              <div className="rating-buttons">
                {[...Array(5)].map((_, index) => (
                  <button
                    key={index}
                    className={`rating-btn ${filters.rating === (index + 1).toString() ? 'active' : ''}`}
                    onClick={() => setFilters({ ...filters, rating: (index + 1).toString() })}
                  >
                    <FaStar color={filters.rating && parseFloat(filters.rating) >= (index + 1) ? '#FFD700' : '#ddd'} />
                  </button> 
                ))}
              </div>
            </div>

            {/* Location Selector */}
            <div className="location-selector">
              <label>Country</label>
              <select
                value={locationQuery.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="custom-select"
              >
                <option value="Brazil">Brazil</option>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
              </select>

              <label>State</label>
              <select
                value={locationQuery.state}
                onChange={(e) => setLocationQuery({ ...locationQuery, state: e.target.value })}
                className="custom-select"
              >
                <option value="">Select State</option>
                {availableStates.map((state, index) => (
                  <option key={index} value={state}>{state}</option>
                ))}
              </select>

              <label>City</label>
              <select
                value={locationQuery.city}
                onChange={(e) => setLocationQuery({ ...locationQuery, city: e.target.value })}
                className="custom-select"
              >
                <option value="">Select City</option>
                {availableCities.map((city, index) => (
                  <option key={index} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="services-grid">
          {services
            .filter((service) => {
              // Filtro de Preço (convertendo para número)
              const servicePrice = parseFloat(service.price.replace("$", "").split("/")[0]);
              if (filters.priceRange === "low" && servicePrice > 100) return false;
              if (filters.priceRange === "high" && servicePrice <= 100) return false;

              // Filtro de Avaliação (comparando como número)
              if (filters.rating && service.rating < parseFloat(filters.rating)) return false;

              return true;
            })
            .map((service, index) => (
              <div className="service-card" key={index}>
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

                  {/* Container para o botão de Request Service centralizado */}
                  <div className="request-service-btn-container">
                    <button className="service-btn" onClick={() => openModal(service)}> Request Service</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default Home;