import { FaSearch, FaMapMarkerAlt, FaHome, FaPaintBrush, FaHammer, FaConciergeBell } from "react-icons/fa";

// Tipagem do estado locationQuery
type LocationQuery = {
  country: string;
  state: string;
  city: string;
};

type HeaderProps = {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  headerLocation: string;
  toggleLocationDropdown: () => void;
  locationDropdownOpen: boolean;
  locationQuery: LocationQuery;
  setLocationQuery: React.Dispatch<React.SetStateAction<LocationQuery>>;
  handleSaveLocation: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
};

const Header: React.FC<HeaderProps> = ({
  selectedCategory,
  setSelectedCategory,
  headerLocation,
  toggleLocationDropdown,
  locationDropdownOpen,
  locationQuery,
  setLocationQuery,
  handleSaveLocation,
  searchQuery,
  setSearchQuery,
  handleSearch,
}) => {

  // Atualização do setLocationQuery com a tipagem correta para select e input
  const handleLocationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof LocationQuery
  ) => {
    setLocationQuery((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <header className="header">
      {/* Logo */}
      <div className="logo">
        <img src="/logo.svg" alt="Logo" />
      </div>

      {/* Barra de Pesquisa */}
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
                onChange={(e) => handleLocationChange(e, "country")}
                className="location-select"
              >
                <option value="Brazil">Brazil</option>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
              </select>
              <input
                type="text"
                placeholder={`State (e.g., ${locationQuery.country === "Brazil" ? "SP" : "CA"})`}
                value={locationQuery.state}
                onChange={(e) => handleLocationChange(e, "state")}
                className="location-input"
              />
              <input
                type="text"
                placeholder={`City (e.g., ${locationQuery.country === "Brazil" ? "São Paulo" : "New York"})`}
                value={locationQuery.city}
                onChange={(e) => handleLocationChange(e, "city")}
                className="location-input"
              />
              <button onClick={handleSaveLocation} className="location-save-btn">
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ações do Header */}
      <div className="header-actions">
        <button className="cta-btn">Sign Up</button>
      </div>

      {/* Menu de Categorias */}
      <nav className="categories-nav">
        <div className="categories-scroll">
          {[
            { name: "Home Services", icon: <FaHome /> },
            { name: "Painting", icon: <FaPaintBrush /> },
            { name: "Repairs", icon: <FaHammer /> },
            { name: "Cooking", icon: <FaConciergeBell /> },
          ].map((category, index) => (
            <button
              key={index}
              className={`category-btn ${selectedCategory === category.name.toLowerCase() ? "selected" : ""}`}
              onClick={() => setSelectedCategory(category.name.toLowerCase())}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
