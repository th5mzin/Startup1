import React, { useState } from "react";
import {
  FaHome,
  FaSearch,
  FaTools,
  FaPaintBrush,
  FaUtensils,
  FaMapMarkerAlt,
  FaStar,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaCrown,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState("home");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState({
    country: "Brazil",
    state: "",
    city: "",
  });
  const [headerLocation, setHeaderLocation] = useState("BR");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [filters, setFilters] = useState({
    price: "",
    rating: "",
    date: "",
  });

  const toggleLocationDropdown = () =>
    setLocationDropdownOpen(!locationDropdownOpen);

  const handleSearch = () => console.log("Search for:", searchQuery);

  const handleSaveLocation = () => {
    const { country, state, city } = locationQuery;
    if (state && city) {
      const location = `${city}, ${state.toUpperCase()}, ${country}`;
      setHeaderLocation(location.length > 20 ? `${city}, ${state.toUpperCase()}` : location);
      setLocationDropdownOpen(false);
    }
  };

  const handleImageChange = (direction: string) => {
    if (direction === "next") {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 2 ? 0 : prevIndex + 1
      );
    } else {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === 0 ? 2 : prevIndex - 1
      );
    }
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
    { name: "Painting", icon: <FaPaintBrush /> },
    { name: "Repairs", icon: <FaTools /> },
    { name: "Cooking", icon: <FaUtensils /> },
  ];

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <img src="/logo.svg" alt="Logo" />
        </div>
        <div className="search-bar-header">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for a service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-btn">
              <FaSearch />
            </button>
          </div>
          <div className="location-selector">
            <button className="location-btn" onClick={toggleLocationDropdown}>
              <FaMapMarkerAlt /> {headerLocation}
            </button>
            {locationDropdownOpen && (
              <div className="location-dropdown">
                <select
                  value={locationQuery.country}
                  onChange={(e) =>
                    setLocationQuery((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  className="location-select"
                >
                  <option value="Brazil">Brazil</option>
                  <option value="USA">USA</option>
                  <option value="Canada">Canada</option>
                </select>
                <input
                  type="text"
                  placeholder={`State (e.g., ${locationQuery.country === 'Brazil' ? 'SP' : 'CA'})`}
                  value={locationQuery.state}
                  onChange={(e) =>
                    setLocationQuery((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                  className="location-input"
                />
                <input
                  type="text"
                  placeholder={`City (e.g., ${locationQuery.country === 'Brazil' ? 'São Paulo' : 'New York'})`}
                  value={locationQuery.city}
                  onChange={(e) =>
                    setLocationQuery((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  className="location-input"
                />
                <button onClick={handleSaveLocation} className="location-save-btn">
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button className="cta-btn">Sign Up</button>
        </div>
      </header>

      {/* Categories */}
      <nav className="categories-nav">
        <div className="categories-scroll">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`category-btn ${
                selectedCategory === category.name.toLowerCase() ? "selected" : ""
              }`}
              onClick={() => setSelectedCategory(category.name.toLowerCase())}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Filter Section */}
      <section className="filter-section">
        <h2>Filters</h2>
        <div className="filters-container">
          <div className="filter-item">
            <label>Price</label>
            <input
              type="number"
              placeholder="Min Price"
              value={filters.price}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, price: e.target.value }))
              }
            />
            <input
              type="number"
              placeholder="Max Price"
              value={filters.price}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, price: e.target.value }))
              }
            />
          </div>
          <div className="filter-item">
            <label>Rating</label>
            <select
              value={filters.rating}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, rating: e.target.value }))
              }
            >
              <option value="">Any</option>
              <option value="4">4 stars</option>
              <option value="5">5 stars</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, date: e.target.value }))
              }
            />
          </div>
        </div>
      </section>

      {/* Banner with Image Slides */}
      <section className="banner">
        <div className="banner-slider">
          <FaArrowLeft
            className="slider-arrow left"
            onClick={() => handleImageChange("prev")}
          />
          <img
            src={`/images/slider${currentImageIndex + 1}.jpg`}
            alt="Banner"
            className="banner-image"
          />
          <FaArrowRight
            className="slider-arrow right"
            onClick={() => handleImageChange("next")}
          />
        </div>
        <h2>Discover Top Services</h2>
        <p>Find the best professionals for your needs</p>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
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
                <img
                  src={service.images[0]}
                  alt="Service"
                  className="service-image"
                />
              </div>
              <div className="service-info">
                <h3>{service.title}</h3>
                <p className="service-price">{service.price}</p>
                <p className="service-location">{service.location}</p>
                <p className="service-description">{service.description}</p>
                <p className="service-name">{service.provider}</p>

                {/* Ratings and Review Count */}
                <div className="stars">
                  {[...Array(5)].map((_, idx) => (
                    <FaStar
                      key={idx}
                      color={idx < service.rating ? "gold" : "lightgray"}
                    />
                  ))}
                  <span className="rating-count">
                    {service.rating} ({service.reviewsCount.toLocaleString()})
                  </span>
                </div>
              </div>
              <div className="service-actions">
                <button className="view-details-btn">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="social-links">
          <a href="https://facebook.com" className="social-icon">
            <FaFacebook />
          </a>
          <a href="https://twitter.com" className="social-icon">
            <FaTwitter />
          </a>
          <a href="https://instagram.com" className="social-icon">
            <FaInstagram />
          </a>
        </div>
        <div className="footer-info">
          <p>© 2024 Your Platform</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
