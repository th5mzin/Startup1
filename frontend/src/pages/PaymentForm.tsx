import React, { useState } from "react";
import { FaCreditCard } from "react-icons/fa";
import "./Payment.css";
import axios from "axios";

interface Provider {
  _id: string;
  firstName: string;
  lastName: string;
  category: string;
  email: string;
  pricePerHour: number;
  formattedAddress: string;
  providerId: string;
  location: {
    lat: number;
    lng: number;
  };
  ratingStats: {
    averageRating: number;
    totalRatings: number;
  };
  servicesCompleted: number;
  avatar: string;
  isBusy: boolean;
}

interface PaymentFormProps {
  onClose: () => void;
  onConfirmPayment: () => Promise<void>;
  totalPrice: number;
  selectedProvider: Provider;
  selectedHours: number;
  startTime: string;
  endTime: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onClose,
  onConfirmPayment,
  totalPrice,
  selectedProvider,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("creditCard");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cvv, setCvv] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [pixQrCode, setPixQrCode] = useState<string>("");
  const [pixCopyCode, setPixCopyCode] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setError("");
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCardNumber = e.target.value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formattedCardNumber);
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedDate = e.target.value
      .replace(/[^0-9]/g, "")
      .replace(/(\d{2})(\d{2})/, "$1/$2");
    setExpiryDate(formattedDate);
  };

  const processPixPayment = async () => {
    try {
      const response = await axios.post(
        "https://api.mercadopago.com/v1/payments",
        {
          transaction_amount: totalPrice, // Valor total em BRL
          description: `Pagamento via PIX para ${selectedProvider.firstName} ${selectedProvider.lastName}`,
          payment_method_id: "pix",
          payer: {
            email: "cliente@example.com", // Substitua pelo e-mail do cliente
          },
        },
        {
          headers: {
            Authorization: `Bearer TEST-3881663633867242-080822-7b4c51c823075cd72844e842af1191a4-1142240884`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      setPixQrCode(data.point_of_interaction.transaction_data.qr_code);
      setPixCopyCode(data.point_of_interaction.transaction_data.qr_code_base64);
    } catch  {
      console.error("Erro ao processar pagamento PIX:");
      setError("Erro ao gerar PIX. Verifique os dados e tente novamente.");
    }
  };
  const processCardPayment = async () => {
    try {
      const response = await axios.post(
        "https://api.stripe.com/v1/payment_intents",
        {
          amount: totalPrice * 100,
          currency: "brl",
          payment_method_types: ["card"],
          payment_method_data: {
            type: "card",
            card: {
              number: cardNumber.replace(/\s/g, ""),
              exp_month: parseInt(expiryDate.split("/")[0]),
              exp_year: 2000 + parseInt(expiryDate.split("/")[1]),
              cvc: cvv,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer sk_test_51QXn2eA15jxYGCvTsPtJhYgkCZSasnKPoi4UxsOUSHnX1EhO65eYWYJhayNgmCcU3YPGrABQXcgQNAt301zRCq3j00tN6tqR0X`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status === "succeeded") {
        await onConfirmPayment(); // Chama a função passada do Modal
      } else {
        setError("Pagamento com cartão não foi concluído.");
      }
    } catch {
      setError("Erro ao processar pagamento com cartão.");
    }
  };

  const handlePaymentConfirm = () => {
    if (paymentMethod === "creditCard") {
      processCardPayment();
    } else if (paymentMethod === "pix") {
      processPixPayment();
    }
  };
  return (
    <div className="payment-form">
      <h3>Informações de Pagamento</h3>
      {error && <div className="error-message">{error}</div>}

      <div className="payment-method-selection">
        <button
          className={`payment-method-btn ${paymentMethod === "creditCard" ? "selected" : ""}`}
          onClick={() => handlePaymentMethodChange("creditCard")}
        >
          <FaCreditCard />
          <span>Cartão de Crédito</span>
        </button>
        <button
          className={`payment-method-btn ${paymentMethod === "pix" ? "selected" : ""}`}
          onClick={() => {
            handlePaymentMethodChange("pix");
            processPixPayment();
          }}
        >
          <span>PIX</span>
        </button>
      </div>

      {paymentMethod === "creditCard" && (
        <>
          <div className="input-field">
            <label>Número do Cartão</label>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="Digite o número do cartão"
              maxLength={19}
              required
            />
          </div>
          <div className="input-field">
            <label>CVV</label>
            <input
              type="text"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="Digite o CVV"
              maxLength={4}
              required
            />
          </div>
          <div className="input-field">
            <label>Data de Validade</label>
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

      {paymentMethod === "pix" && (
        <div className="pix-details">
          <h4>Pagamento PIX</h4>
          {pixQrCode ? (
            <>
              <img src={pixQrCode} alt="QR Code PIX" />
              <p>
                <strong>Copia e Cola:</strong> {pixCopyCode}
              </p>
            </>
          ) : (
            <p>Gerando PIX...</p>
          )}
        </div>
      )}

      <div className="payment-summary">
        <div className="invoice">
          <div className="invoice-item">
            <span>Serviço: {selectedProvider.category}</span>
            <span>R$ {totalPrice.toFixed(2)}</span>
          </div>
          <div className="invoice-total">
            <span>Total:</span>
            <span>R$ {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button className="confirm-btn" onClick={handlePaymentConfirm}>
        Confirmar Pagamento
      </button>
      <button className="cancel-btn" onClick={onClose}>
        Cancelar
      </button>
    </div>
  );
};

export default PaymentForm;
