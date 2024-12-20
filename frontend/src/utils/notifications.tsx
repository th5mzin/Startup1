// src/utils/notifications.tsx
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";

// Estilos personalizados para as notificações
const customStyle = {
  success: {
    backgroundColor: "transparent",
    color: "#fff",
    display: "flex",
    alignItems: "center",
  },
  error: {
    backgroundColor: "transparent",
    color: "#fff",
    display: "flex",
    alignItems: "center",
  },
  info: {
    backgroundColor: "transparent",
    color: "#fff",
    display: "flex",
    alignItems: "center",
  },
};

// Funções para notificações
export const notifySuccess = (message: string) => {
  toast.success(
    <div style={customStyle.success}>
      <FaCheckCircle style={{ marginRight: "8px" }} />
      {message}
    </div>,
    { icon: false }
  );
};

export const notifyError = (message: string) => {
  toast.error(
    <div style={customStyle.error}>
      <FaExclamationCircle style={{ marginRight: "8px" }} />
      {message}
    </div>,
    { icon: false }
  );
};

export const notifyInfo = (message: string) => {
  toast.info(
    <div style={customStyle.info}>
      <FaInfoCircle style={{ marginRight: "8px" }} />
      {message}
    </div>,
    { icon: false }
  );
};

// Componente para renderizar o ToastContainer (adicione uma vez no App)
export const NotificationContainer = () => (
  <ToastContainer
    position="top-right"
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop={true}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="colored"
  />
);
