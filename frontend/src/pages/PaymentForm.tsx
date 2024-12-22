import React, { useState } from "react";
import { FaCreditCard } from "react-icons/fa";
import "./Payment.css";
import { notifySuccess, notifyError } from "../utils/notifications";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";


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
  const [pixQrCode, setPixQrCode] = useState<string>("");
  const [pixCopyCode, setPixCopyCode] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setError("");
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
  const stripePromise = loadStripe("pk_test_51QXn2eA15jxYGCvTJTjaVlIdWpvKlKW69iXq0vB1WnjFXkGsL43ZztdKHDXaGCGlddIcsEuVmNFp9SzNaT4Iw9Db00IouJQ5ec");
  const processCardPayment = async () => {
    try {
      // Passo 1: Criar o PaymentIntent
      const payload = new URLSearchParams();
      payload.append("amount", Math.round(totalPrice * 100).toString()); // Valor em centavos
      payload.append("currency", "brl"); // Moeda
      payload.append("payment_method_types[]", "card"); // Tipo de pagamento
      payload.append(
        "description",
        `Pagamento com cartão para ${selectedProvider.firstName} ${selectedProvider.lastName}`
      );
  
      console.log("Payload enviado para Stripe:", payload.toString());
  
      const intentResponse = await axios.post(
        "https://api.stripe.com/v1/payment_intents",
        payload,
        {
          headers: {
            Authorization: `Bearer sk_test_51QXn2eA15jxYGCvTsPtJhYgkCZSasnKPoi4UxsOUSHnX1EhO65eYWYJhayNgmCcU3YPGrABQXcgQNAt301zRCq3j00tN6tqR0X`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
  
      const clientSecret = intentResponse.data.client_secret;
  
      console.log("PaymentIntent criado com sucesso:", intentResponse.data);
  
      // Passo 2: Inicializar o Stripe e montar o elemento do cartão
      const stripe = await stripePromise;
      if (!stripe) {
        notifyError("Stripe não foi carregado corretamente.");
        return;
      }
  
      const elements = stripe.elements();
      const cardElement = elements.create("card");
  
      // Montar o elemento do cartão no contêiner correto
      const cardElementContainer = document.getElementById("card-element");
      if (!cardElementContainer) {
        notifyError("Elemento do cartão não encontrado no DOM.");
        return;
      }
  
      cardElement.mount("#card-element");
  
      // Passo 3: Confirmar o pagamento
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });
  
      if (result.error) {
        console.error("Erro ao confirmar pagamento:", result.error);
        notifyError(result.error.message || "Erro ao confirmar pagamento.");
      } else if (result.paymentIntent?.status === "succeeded") {
        console.log("Pagamento concluído com sucesso:", result.paymentIntent);
        notifySuccess("Pagamento com cartão concluído com sucesso!");
        await onConfirmPayment();
      } else {
        console.error("Pagamento não concluído. Resposta da API:", result.paymentIntent);
        notifyError("Pagamento não concluído. Tente novamente.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Erro ao processar pagamento com cartão:", error.response?.data || error.message);
        notifyError(error.response?.data?.error?.message || "Erro ao processar pagamento.");
      } else {
        console.error("Erro inesperado:", error);
        notifyError("Erro inesperado. Tente novamente.");
      }
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
<div className="payment-form bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
    Informações de Pagamento
  </h3>
  {error && (
    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
      {error}
    </div>
  )}

  <div className="payment-method-selection flex gap-4 mb-6 justify-center">
    <button
      className={`py-3 px-6 rounded-lg transition-all ${
        paymentMethod === "creditCard"
          ? "bg-blue-600 text-white"
          : "bg-gray-200 text-gray-800"
      }`}
      onClick={async () => {
        handlePaymentMethodChange("creditCard");
        const stripe = await stripePromise;
        if (stripe) {
          const elements = stripe.elements();
          const cardElement = elements.create("card", {
            style: {
              base: {
                color: "#333",
                fontFamily: '"Poppins", sans-serif',
                fontSize: "16px",
                fontWeight: "500",
                letterSpacing: "0.5px",
                lineHeight: "24px",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#e53e3e",
                iconColor: "#e53e3e",
              },
            },
          });
          cardElement.mount("#card-element");
        }
      }}
    >
      <FaCreditCard className="inline-block mr-2" />
      Cartão de Crédito
    </button>
    <button
      className={`py-3 px-6 rounded-lg transition-all ${
        paymentMethod === "pix"
          ? "bg-blue-600 text-white"
          : "bg-gray-200 text-gray-800"
      }`}
      onClick={() => {
        handlePaymentMethodChange("pix");
        processPixPayment();
      }}
    >
      PIX
    </button>
  </div>

  {paymentMethod === "creditCard" && (
    <div className="mb-6">
      <label className="block text-gray-700 font-medium mb-2">
        Informações do Cartão
      </label>
      <div
        id="card-element"
        className="border border-gray-300 rounded-lg bg-gray-50 p-4 shadow-inner"
      ></div>
      <p className="text-sm text-gray-500 mt-2">
        Insira as informações do cartão de crédito acima.
      </p>
    </div>
  )}

  {paymentMethod === "pix" && (
    <div className="text-center mb-6">
      <h4 className="text-lg font-medium mb-4">Pagamento PIX</h4>
      {pixQrCode ? (
        <>
          <img
            src={pixQrCode}
            alt="QR Code PIX"
            className="w-48 h-48 mx-auto mb-4"
          />
          <p className="text-gray-700">
            <strong>Copia e Cola:</strong> {pixCopyCode}
          </p>
        </>
      ) : (
        <p className="text-gray-500">Gerando PIX...</p>
      )}
    </div>
  )}

  <div className="payment-summary bg-gray-100 p-4 rounded-lg mb-6 shadow-sm">
    <h4 className="text-lg font-medium mb-3">Resumo do Pagamento</h4>
    <div className="flex justify-between text-gray-800 mb-2">
      <span>Serviço:</span>
      <span>{selectedProvider.category}</span>
    </div>
    <div className="flex justify-between text-gray-800 mb-2">
      <span>Valor:</span>
      <span>R$ {totalPrice.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-gray-800 font-bold text-lg">
      <span>Total:</span>
      <span>R$ {totalPrice.toFixed(2)}</span>
    </div>
  </div>

  <button
    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium text-lg hover:bg-green-700 mb-3"
    onClick={handlePaymentConfirm}
  >
    Confirmar Pagamento
  </button>
  <button
    className="w-full py-3 bg-red-600 text-white rounded-lg font-medium text-lg hover:bg-red-700"
    onClick={onClose}
  >
    Cancelar
  </button>
</div>

  );
};

export default PaymentForm;
