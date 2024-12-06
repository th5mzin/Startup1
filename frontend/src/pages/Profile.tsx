import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSignOutAlt,
  FaCalendarAlt,
  FaEnvelope,
  FaRegClock,
  FaWallet,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<{
    avatar: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }>({
    avatar: "/images/avatar.jpg",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "Service Provider",
  });

  const [serviceProviderStats] = useState({
    balance: "200",
    acceptedRequests: 10,
    rejectedRequests: 2,
    inProgressRequests: 3,
  });

  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [appointments] = useState([
    { id: 1, service: "Electrical Repair", date: "2024-12-05", status: "Accepted" },
    { id: 2, service: "Plumbing", date: "2024-12-08", status: "Pending" },
    { id: 3, service: "Painting", date: "2024-12-10", status: "Accepted" }
  ]);

  const [recentServices] = useState([
    { id: 1, service: "Electrical Repair", date: "2024-11-20", price: "$50", status: "Completed" },
    { id: 2, service: "Plumbing", date: "2024-11-18", price: "$75", status: "Completed" },
    { id: 3, service: "Painting", date: "2024-11-15", price: "$100", status: "Completed" },
    { id: 4, service: "Carpentry", date: "2024-11-10", price: "$80", status: "Completed" },
    { id: 5, service: "Gardening", date: "2024-11-05", price: "$40", status: "Completed" },
  ]);

  const [serviceDetails, setServiceDetails] = useState<{
    category: string;
    description: string;
    location: {
      country: string;
      state: string;
      city: string;
    };
    photos: File[];
    price: number | ''; // Adicionando o campo de preço
  }>({
    category: "",
    description: "",
    location: {
      country: "",
      state: "",
      city: "",
    },
    photos: [],
    price: 0,
  });

  const [messages] = useState([
    { id: 1, from: "Client A", message: "Interested in your service.", time: "2 hours ago" },
    { id: 2, from: "Client B", message: "Can you provide a quote?", time: "1 day ago" }
  ]);

  const [activeMessage, setActiveMessage] = useState<{ id: number; from: string; message: string } | null>(null);
  const [reply, setReply] = useState("");

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + serviceDetails.photos.length > 5) {
      alert("Você pode fazer upload de no máximo 5 fotos.");
      return;
    }
    setServiceDetails(prevDetails => ({
      ...prevDetails,
      photos: [...prevDetails.photos, ...files],
    }));
  };

  const removePhoto = (index: number) => {
    setServiceDetails(prevDetails => ({
      ...prevDetails,
      photos: prevDetails.photos.filter((_, i) => i !== index),
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Verificação para garantir que o preço não seja negativo
    if (name === "price") {
      const numericValue = Number(value);
      if (numericValue < 0) {
        return; // Não atual izar o estado se o valor for negativo
      }
    }

    setServiceDetails(prevDetails => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleLogout = () => {
    navigate('/'); // Altere '/' para a rota da sua página principal, se necessário
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setServiceDetails(prevDetails => ({
      ...prevDetails,
      location: {
        ...prevDetails.location,
        [name]: value,
      },
    }));
  };

  const openCreateServiceModal = () => {
    setShowCreateServiceModal(true);
  };

  const closeCreateServiceModal = () => {
    setShowCreateServiceModal(false);
    setServiceDetails({
      category: "",
      description: "",
      location: {
        country: "",
        state: "",
        city: "",
      },
      photos: [],
      price: 0,
    });
  };

  const handleSendReply = () => {
    if (reply.trim() === "") {
      alert("Please type a reply before sending.");
      return;
    }
    console.log(`Reply sent to ${activeMessage?.from}: ${reply}`);
    setReply("");
    setActiveMessage(null);
  };

  const handleMessageClick = (id: number) => {
    const message = messages.find(msg => msg.id === id);
    if (message) {
      setActiveMessage(message);
    }
  };

  return (
    <div className="profile-container">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Back
        </button>
        <h1>Your Profile</h1>
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      <div className="user-info">
        <div className="avatar-container" onClick={() => document.getElementById("avatar-upload")?.click()}>
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onloadend = () => {
                  setUserData((prevData) => ({ ...prevData, avatar: reader.result as string }));
                };
                reader.readAsDataURL(file);
              }
            }}
            style={{ display: "none" }}
          />
          <img src={userData.avatar} alt="User  Avatar" className="avatar" />
        </div>
        <h2>{userData.firstName} {userData.lastName}</h2>
        <p>Email: {userData.email}</p>
        <p>Role: {userData.role}</p>
      </div>

      <div className="create-service-button">
        <button onClick={openCreateServiceModal} className="cta-btn">
          Create New Service
        </button>
      </div>

      {showCreateServiceModal && (
        <div className="create-service-modal">
          <div className="create-service-modal-content">
            <h3>Create New Service</h3>
            <form onSubmit={(e) => { e.preventDefault(); closeCreateServiceModal(); }}>
              <div className="form-group">
                <label htmlFor="category">Category:</label>
                <select
                  id="category"
                  name="category"
                  value={serviceDetails.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Painting">Painting</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={serviceDetails.description}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  style={{ resize: "none" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="price">Price:</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={serviceDetails.price === '' ? '' : serviceDetails.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || Number(value) >= 0) {
                      setServiceDetails(prevDetails => ({
                        ...prevDetails,
                        price: value === '' ? '' : Number(value),
                      }));
                    }
                  }}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Location:</label>
                <select name="country" value={serviceDetails.location.country} onChange={handleLocationChange} required>
                  <option value="">Select Country</option>
                  <option value="USA">USA</option>
                  <option value="Canada">Canada</option>
                </select>
                <select name="state" value={serviceDetails.location.state} onChange={handleLocationChange} required>
                  <option value="">Select State</option>
                  <option value="California">California</option>
                  <option value="Texas">Texas</option>
                </select>
                <select name="city" value={serviceDetails.location.city} onChange={handleLocationChange} required>
                  <option value="">Select City</option>
                  <option value="Los Angeles">Los Angeles</option>
                  <option value="Houston">Houston</option>
                </select>
              </div>
              <div className="form-group">
                <label>Photos:</label>
                <div className="photo-upload-circle" onClick={() => document.getElementById("photo-upload")?.click()}>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                  />
                  <div className="circle">+</div>
                </div>
                <div className="uploaded-photos">
                  {serviceDetails.photos.map((photo, index) => (
                    <div key={index} className="photo-preview">
                      <img src={URL.createObjectURL(photo)} alt={`Preview ${index}`} className="thumbnail" />
                      <button type="button" onClick={() => removePhoto(index)} className="remove-photo-button">X</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="cta-btn">Create Service</button>
                <button type="button" className="cta-btn cancel-btn" onClick={closeCreateServiceModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {serviceProviderStats && (
        <div className="user-stats">
          <div className="balance-container">
            <span className="currency-symbol">$</span>
            <span className="balance-value">{serviceProviderStats.balance}</span>
            <div className="wallet-icon">
              <FaWallet />
            </div>
          </div>

          <div className="requests-container">
            <div className="request-item">
              <FaCheckCircle />
              <h3>Accepted</h3>
              <p>{serviceProviderStats.acceptedRequests}</p>
            </div>
            <div className="request-item">
              <FaTimesCircle />
              <h3>Rejected</h3>
              <p>{serviceProviderStats.rejectedRequests}</p>
            </div>
            <div className="request-item">
              <FaHourglassHalf />
              <h3>In Progress</h3>
              <p>{serviceProviderStats.inProgressRequests}</p>
            </div>
          </div>
        </div>
      )}

      <div className="appointments-container">
        <h3><FaCalendarAlt /> Your Schedule</h3>
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="appointment-item">
              <h4>{appointment.service}</h4>
              <p><FaRegClock /> {appointment.date}</p>
              <p>Status: {appointment.status}</p>
              {appointment.status === "Pending" && (
                <div className="appointment-actions">
                  <button className="cta-btn">Accept</button>
                  <button className="cta-btn reject-btn">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="recent-services-container">
        <h3>Recent Services</h3>
        <ul className="recent-services-list">
          {recentServices.slice(0, 5).map((service) => (
            <li key={service.id} className="recent-service-item">
              <h4>{service.service}</h4>
              <p>Date: {service.date}</p>
              <p>Price: {service.price}</p>
              <p>Status: {service.status}</p>
            </li>
 ))}
        </ul>
      </div>

      <div className="messages-container">
        <h3><FaEnvelope /> Messages</h3>
        {messages.length > 0 ? (
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className="message-item"
                onClick={() => handleMessageClick(message.id)}
              >
                <h4>{message.from}</h4>
                <p>{message.message}</p>
                <small><FaRegClock /> {message.time}</small>
              </div>
            ))}
          </div>
        ) : (
          <p>No messages</p>
        )}
      </div>

      {activeMessage && (
        <div className="message-modal">
          <div className="message-modal-content">
            <h3>Reply to {activeMessage.from}</h3>
            <p>{activeMessage.message}</p>

            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply..."
              rows={4}
              className="reply-textarea"
            />

            <div className="message-modal-actions">
              <button className="cta-btn send-reply-btn" onClick={handleSendReply}>
                Send Reply
              </button>
              <button className="cta-btn cancel-reply-btn" onClick={() => setActiveMessage(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;