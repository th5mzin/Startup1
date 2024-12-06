import React, { useState, useEffect } from "react";
import { FaCreditCard, FaPaypal, FaCcMastercard, FaCcVisa } from "react-icons/fa";
import { SiMercadopago } from "react-icons/si"; // Mercado Pago
import "./Payment.css";

interface PaymentFormProps {
  onClose: () => void;
  onConfirmPayment: (paymentInfo: PaymentInfo) => void;
  totalPrice: number;
  selectedService: {
    title: string;
    price: string;
    provider: string;
    location: string;
    description: string;
  };
  selectedDates: string[]; // Inclui selectedDates
}

interface PaymentInfo {
  paymentMethod: string;
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  address: string;
  selectedDates: string[]; // Inclui selectedDates
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onClose,
  onConfirmPayment,
  totalPrice,
  selectedService,
  selectedDates,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("creditCard");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cvv, setCvv] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [cardType, setCardType] = useState<string>("");

  // Detecta o tipo de cartão baseado no primeiro número
  useEffect(() => {
    if (cardNumber.length >= 1) {
      const firstDigit = cardNumber[0];
      if (firstDigit === "4") {
        setCardType("visa");
      } else if (firstDigit === "5") {
        setCardType("mastercard");
      } else {
        setCardType("");
      }
    }
  }, [cardNumber]);

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCardNumber = e.target.value
      .replace(/\D/g, "")
      .slice(0, 16) // Limita a 16 números
      .replace(/(\d{4})(?=\d)/g, "$1 "); // Formata com espaços
    setCardNumber(formattedCardNumber);
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedDate = e.target.value
      .replace(/[^0-9]/g, "")
      .replace(/(\d{2})(\d{2})/, "$1/$2");
    setExpiryDate(formattedDate);
  };

  const handlePaymentConfirm = () => {
    const paymentInfo: PaymentInfo = {
      paymentMethod,
      cardNumber,
      cvv,
      expiryDate,
      address,
      selectedDates, // Envia as datas selecionadas
    };

    // Chama a função de confirmação de pagamento
    onConfirmPayment(paymentInfo);
  };

  return (
    <div className="payment-form">
      <h3>Payment Information</h3>

      {/* Seção de método de pagamento */}
      <div className="payment-method-selection">
        <button
          className={`payment-method-btn ${paymentMethod === "creditCard" ? "selected" : ""}`}
          onClick={() => handlePaymentMethodChange("creditCard")}
        >
          <FaCreditCard />
          <span>Credit Card</span>
        </button>
        <button
          className={`payment-method-btn ${paymentMethod === "paypal" ? "selected" : ""}`}
          onClick={() => handlePaymentMethodChange("paypal")}
        >
          <FaPaypal />
          <span>PayPal</span>
        </button>
        <button
          className={`payment-method-btn ${paymentMethod === "mercadoPago" ? "selected" : ""}`}
          onClick={() => handlePaymentMethodChange("mercadoPago")}
        >
          <SiMercadopago />
          <span>Mercado Pago</span>
        </button>
      </div>

      {/* Campo de número do cartão */}
      {paymentMethod === "creditCard" && (
        <div className="input-field">
          <label>Card Number</label>
          <div className="card-number-container">
            {/* Ícone do cartão */}
            <div className="card-icon">
              {cardType === "visa" && <FaCcVisa />}
              {cardType === "mastercard" && <FaCcMastercard />}
              {!cardType && <FaCreditCard />}
            </div>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="Enter card number"
              maxLength={19} // Limita a 16 números + 3 espaços
              required
            />
          </div>
        </div>
      )}

      {/* Outros campos para cartões de crédito */}
      {paymentMethod === "creditCard" && (
        <>
          <div className="input-field">
            <label>CVV</label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="Enter CVV"
              maxLength={4}
              required
            />
          </div>
          <div className="input-field">
            <label>Expiry Date</label>
            <input
              type="text"
              value={expiryDate}
              onChange={handleExpiryDateChange}
              placeholder="MM/YY"
              maxLength={5}
              required
            />
          </div>
        </>
      )}

      {/* Campo de endereço */}
      <div className="input-field">
        <label>Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your billing address"
          required
        />
      </div>

      {/* Resumo da fatura */}
      <div className="payment-summary">
        <div className="invoice">
          <div className="invoice-item">
            <span>Service: {selectedService.title}</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="invoice-total">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Botões de confirmar e cancelar */}
      <button className="confirm-btn" onClick={handlePaymentConfirm}>
        Confirm Payment
      </button>
      <button className="cancel-btn" onClick={onClose}>
        Cancel
      </button>
    </div>
  );
};

export default PaymentForm;