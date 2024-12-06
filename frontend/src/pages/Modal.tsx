import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom"; // Importar ReactDOM para usar portais
import "./Modal.css";
import PaymentForm from "./PaymentForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

interface PaymentInfo {
  paymentMethod: string;
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  address: string;
  selectedDates: string[];
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // Adiciona a função de confirmação
  selectedService: Service; // Ajuste o tipo conforme necessário
  totalPrice: number;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, selectedService, totalPrice }) => {
  const [paymentType, setPaymentType] = useState("hour");
  const [hours, setHours] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState(totalPrice);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (selectedService) {
      setCalculatedPrice(parseFloat(selectedService.price.replace("$", "").replace("/hour", "")));
    }
  }, [selectedService]);

  useEffect(() => {
    calculateTotalPrice(paymentType, hours, selectedDates);
  }, [paymentType, hours, selectedDates]);

  const handleDateSelection = (dates: [Date | null, Date | null]) => {
    if (!dates) return;

    const [start, end] = dates;

    if (start && end) {
      const diffInTime = end.getTime() - start.getTime();
      const diffInDays = diffInTime / (1000 * 3600 * 24) + 1;

      if (diffInDays > 30) {
        alert("Você pode selecionar no máximo 30 dias.");
        return;
      }

      const formattedDates = [];
      for (let i = 0; i < diffInDays; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        formattedDates.push(date.toISOString().split('T')[0]);
      }

      setSelectedDates(formattedDates);
      setStartDate(start);
      setEndDate(end);
    } else if (start) {
      setStartDate(start);
      setSelectedDates([start.toISOString().split('T')[0]]);
    } else {
      setStartDate(null);
      setEndDate(null);
      setSelectedDates([]);
    }
  };

  const toggleDateModal = () => {
    setShowDateModal(!showDateModal);
  };

  const calculateTotalPrice = (type: string, numHours: number, dates: string[]) => {
    const hourlyRate = parseFloat(selectedService.price.replace("$", "").replace("/hour", ""));
    const dailyRate = parseFloat(selectedService.price.replace("$", "").replace("/day", ""));

    if (type === "hour") {
      setCalculatedPrice(hourlyRate * numHours);
    } else if (type === "day") {
      setCalculatedPrice(dailyRate);
    }

    if (dates.length > 0) {
      const totalDays = dates.length;
      setCalculatedPrice(dailyRate * totalDays);
    }
  };

  const handleConfirmRequest = () => {
    setShowPaymentForm(true); // Exibe o PaymentForm
  };

  const handleConfirmPayment = (paymentInfo: PaymentInfo) => {
    console.log("Pagamento confirmado:", paymentInfo);
    setShowPaymentForm(false);
    onClose(); // Fecha o modal principal se necessário
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>{selectedService?.title}</h2>
            <button className="modal-close" onClick={onClose}>
              <span className="close-icon">X</span>
            </button>
          </div>

          <div className="modal-body">
            <div className="service-image">
              {selectedService.images.length > 0 ? (
                <img
                  src={selectedService.images[0]}
                  alt={selectedService.title}
                  className="service-img"
                />
              ) : (
                <div className="no-image">No image available</div>
              )}
            </div>

            <div className="service-details-container">
              <div className="service-details">
                <h3>Details</h3>
                <p>{selectedService.description}</p>
                <p><strong>Provider:</strong> {selectedService.provider}</p>
                <p><strong>Location:</strong> {selectedService.location}</p>
                <p><strong>Rating:</strong> {selectedService.rating} stars ({selectedService.reviewsCount} reviews)</p>
              </div>

              <div className="price-summary">
                <p><strong>Price:</strong> ${calculatedPrice.toFixed(2)}</p>
              </div>
            </div>

            <div className="service-options">
              <div className="payment-type">
                <button
                  className={`payment-type-btn ${paymentType === "hour" ? "selected" : ""}`}
                  onClick={() => {
                    setPaymentType("hour");
                    setHours(1); // Reset hours when changing to hourly payment
                  }}
                >
                  Hourly
                </button>
                <button
                  className={`payment-type-btn ${paymentType === "day" ? "selected" : ""}`}
                  onClick={() => {
                    setPaymentType("day");
                    setSelectedDates([]); // Reset selected dates when changing to daily payment
                  }}
                >
                  Daily
                </button>
              </div>

              {paymentType === "hour" && (
                <div className="hour-container">
                  <h3 className="hour-title">Hours</h3>
                  <select
                    id="hourSelect"
                    className="hour-selection"
                    value={hours}
                    onChange={(e) => {
                      const selectedHours = parseInt(e.target.value, 10);
                      setHours(selectedHours);
                      calculateTotalPrice("hour", selectedHours, selectedDates);
                    }}
                  >
                    <option value="">Select hours</option>
                    {[...Array(8).keys()].map((i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {paymentType === "day" && (
                <div className="day-selection">
                  <button onClick={toggleDateModal}>Select Dates</button>
                </div>
              )}
            </div>

            <div className="day-selection" style={{ position: 'relative' }}>
    {showDateModal && (
        <div className="datepicker-popup">
            <DatePicker
                selected={startDate}
                onChange={(dates: [Date | null, Date | null]) => handleDateSelection(dates)}
                startDate={startDate ?? undefined}
                endDate={endDate ?? undefined}
                selectsRange
                inline
                isClearable
                placeholderText="Select date range"
            />
            <div className="selected-dates">
                {selectedDates.length > 0 && (
                    <span className="selected-dates-text">
                        {selectedDates.length === 1
                            ? `Selected date: ${selectedDates[0]}`
                            : `From ${selectedDates[0]} to ${selectedDates[selectedDates.length - 1]}`}
                    </span>
                )}
                {selectedDates.length === 0 && (
                    <span className="no-dates-selected">No dates selected</span>
                )}
            </div>
            <button className="confirm-dates-btn" onClick={toggleDateModal}>Confirm Dates</button>
        </div>
    )}
</div>
<div className="modal-footer">
    <button className="confirm-btn" onClick={handleConfirmRequest}>
        Proceed to Payment
    </button>
</div>
          </div>
        </div>
      </div>

      {showPaymentForm && (
        <>
          <div className="overlay" onClick={() => setShowPaymentForm(false)}></div>
          {ReactDOM.createPortal(
            <PaymentForm
              totalPrice={calculatedPrice}
              onClose={() => {
                setShowPaymentForm(false);
                onClose();
              }}
              onConfirmPayment={handleConfirmPayment}
              selectedService={selectedService}
              selectedDates={selectedDates}
            />,
            document.body
          )}
        </>
      )}
    </>
);
};

export default Modal;