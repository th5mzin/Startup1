import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { notifySuccess, notifyError } from "../utils/notifications";
import {
  FaArrowLeft,
  FaSignOutAlt,
  FaWallet,
  FaCheckCircle,
  FaStar,
  FaTimes,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import "./Profile.css";

interface Address {
  zipCode: string;
  street: string;
  houseNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
}

interface AccountInfo {
  bank: string;
  key: string;
  account: string;
  agency: string;
  cpf: string;
  name: string;
  keyType?: string;  // Add the keyType property, mark it as optional
}
interface UserData {
  _id: string; // ObjectId do usuário
  providerId: string | null; // ID do prestador, se aplicável
  avatar: string;
  email: string;
  firstName: string;
  lastName: string;
  ratingStats?: {
    averageRating: number;
    totalRatings: number;
  };
  completedRequests: number;
  role: string; // Mudado de "cliente" para "user"
  balance: number; // Mudado para number
}

interface Request {
  _id: string;
  category: string;
  status: string;
  pricePerHour: number;
  totalPrice: number;
  startTime: string;
  endTime: string;
  address: Address; // Mudei de string para Address
  user: { firstName: string; lastName: string };
  provider?: { firstName: string; lastName: string };
}

const Profile = () => {
  const navigate = useNavigate();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
const [rating, setRating] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("BRL");
  const [requests, setRequests] = useState<Request[]>([]);
  const [withdrawMethod, setWithdrawMethod] = useState<string>("pix");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isLoadingWithdraw, setIsLoadingWithdraw] = useState(false); // Estado de carregamento

const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
const [accountInfo, setAccountInfo] = useState<AccountInfo>({
  bank: "",
  key: "",
  account: "",
  agency: "",
  cpf: "",
  name: ""
});
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
const [displayedBalance, setDisplayedBalance] = useState(0);

// Função para abrir o modal e definir a solicitação a ser deletada
const openDeleteModal = (requestId: string) => {
  setRequestToDelete(requestId);
  setIsDeleteModalOpen(true);
};

// Fechar modal de exclusão
const closeDeleteModal = () => {
  setRequestToDelete(null);
  setIsDeleteModalOpen(false);
};
const validateWithdrawInfo = (method: string, account: AccountInfo): string => {
  if (method === "pix") {
    if (!account.key) return "Chave PIX é obrigatória.";
    const cpfPattern = /^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$/;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phonePattern = /^\(\d{2}\) \d{1} \d{4}-\d{4}$/;

    if (cpfPattern.test(account.key) || emailPattern.test(account.key) || phonePattern.test(account.key)) {
      return "";
    }
    return "Chave PIX inválida.";
  } else if (method === "bank_transfer") {
    if (!account.bank || !account.account || !account.agency) {
      return "Dados bancários incompletos.";
    }
    const accountPattern = /^[0-9]{6,12}$/;
    const agencyPattern = /^[0-9]{4,6}$/;

    if (!accountPattern.test(account.account)) return "Número da conta inválido.";
    if (!agencyPattern.test(account.agency)) return "Número da agência inválido.";
  }
  return "";
};

const [errorMessage, setErrorMessage] = useState<string>("");
const [currentRequestId, setCurrentRequestId] = useState<string | null>(null); 
  const handleCancelRequest = async (requestId: string): Promise<void> => {
    try {
      await axios.delete(`http://localhost:5000/api/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      notifySuccess("Solicitação cancelada com sucesso.");
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (error) {
      console.error("Erro ao cancelar solicitação:", error);
      notifyError("Erro ao cancelar solicitação.");
    }
  };
  const openRatingModal = (requestId: string) => {
    setCurrentRequestId(requestId); // Armazena o ID da solicitação ao abrir o modal
    setIsRatingModalOpen(true);
  };
  
  
  // Função para fechar o modal
  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
  };
  const openWithdrawModal = () => {
    setIsWithdrawModalOpen(true);
  };
  
  const closeWithdrawModal = () => {
    setIsWithdrawModalOpen(false);
  };
  const handleWithdraw = async () => {
    setErrorMessage(""); // Limpa mensagens de erro anteriores
    setIsLoadingWithdraw(true); // Ativa o carregamento
  
    if (!withdrawAmount || withdrawAmount <= 0) {
      setErrorMessage("Insira um valor válido para saque.");
      setIsLoadingWithdraw(false);
      return;
    }
  
    const validationMessage = validateWithdrawInfo(withdrawMethod, accountInfo);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      setIsLoadingWithdraw(false);
      return;
    }
  
    const paymentDetails =
      withdrawMethod === "pix"
        ? { key: accountInfo.key, keyType: accountInfo.keyType }
        : {
            bank: accountInfo.bank,
            account: accountInfo.account,
            agency: accountInfo.agency,
            cpf: accountInfo.cpf,
            name: accountInfo.name,
          };
  
    try {
      await axios.post(
        "http://localhost:5000/api/requests/withdraw",
        {
          providerId: userData?._id,
          amount: withdrawAmount,
          paymentDetails,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
  
      notifySuccess("Solicitação de saque enviada com sucesso!");
  
      // Fecha o modal e atualiza o perfil para evitar saques duplicados
      closeWithdrawModal();
      await fetchUserProfile(); // Atualiza o saldo e os dados do usuário
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Erro ao solicitar saque:", error.response?.data || error.message);
        setErrorMessage(
          error.response?.data?.message || "Erro ao solicitar saque. Tente novamente."
        );
      } else {
        console.error("Erro desconhecido:", error);
        setErrorMessage("Erro inesperado. Tente novamente mais tarde.");
      }
    } finally {
      setIsLoadingWithdraw(false); // Finaliza o carregamento
    }
  };
  const handleDeleteRequest = async () => {
    if (!requestToDelete) {
      console.error("Nenhuma solicitação selecionada para deletar.");
      return;
    }
  
    try {
      console.log("Tentando deletar a solicitação:", requestToDelete);
      const response = await axios.delete(
        `http://localhost:5000/api/requests/${requestToDelete}/delete`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
  
      console.log(response.data.message);
      notifySuccess("Solicitação removida com sucesso!");
      setRequests((prev) => prev.filter((req) => req._id !== requestToDelete));
      closeDeleteModal();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Erro ao deletar solicitação:", error.response?.data || error.message);
        notifyError(
          error.response?.data?.message || "Erro ao remover solicitação. Verifique os logs."
        );
      } else {
        console.error("Erro desconhecido:", error);
      }
    }
  };
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/user/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
  
        const user = response.data.user;
  
        if (!user) {
          console.error("User data is undefined");
          notifyError("Dados do usuário não encontrados.");
          navigate("/");
          return;
        }
        setCurrencySymbol(user.currency || "BRL");
        setUserData(user); // Atualiza os dados do usuário no estado
        animateBalance(0, user.balance);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        notifyError("Erro ao carregar perfil. Tente novamente.");
        navigate("/");
      }
    };
  
    fetchUserProfile(); // Chama a função para carregar o perfil
  }, [navigate]);
  
  // Carrega as solicitações após os dados do usuário serem carregados
  useEffect(() => {
    const fetchRequests = async () => {
      if (!userData || !userData._id) return;
  
      const endpoint =
        userData.role === "service-provider"
          ? `http://localhost:5000/api/requests/provider/${userData.providerId}`
          : `http://localhost:5000/api/requests/by-user/${userData._id}`;
  
      try {
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
  
        setRequests(response.data || []); // Atualiza as solicitações com os dados
      } catch (error) {
        console.error("Erro ao buscar solicitações:", error);
        notifyError("Erro ao carregar solicitações.");
      }
    };
  
    fetchRequests(); // Chama a função para carregar as solicitações
  }, [userData]); // Atualiza apenas quando `userData` for carregado
  

  // Carregar solicitações apenas após o `userData` estar disponível
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/user/profile", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      const user = response.data.user;
      if (!user) {
        console.error("User data is undefined");
        notifyError("Dados do usuário não encontrados.");
        navigate("/");
        return;
      }
  
      setUserData(user);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      notifyError("Erro ao carregar perfil. Tente novamente.");
      navigate("/");
    }
  };
  
  useEffect(() => {
    fetchUserProfile(); // Reutiliza a função aqui
  }, [navigate]);
   // Este useEffect depende apenas de `userData` para disparar a requisição
  
// Formatação para CPF
const formatCPF = (value: string) => {
  // Remove qualquer coisa que não seja número
  const digits = value.replace(/\D/g, "");
  
  // Formata CPF no padrão 000.000.000-00
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  
  return value;
};

// Formatação para Telefone
const formatPhone = (value: string) => {
  // Remove qualquer coisa que não seja número
  const digits = value.replace(/\D/g, "");

  // Formata Telefone no padrão (XX) X XXXX-XXXX
  if (digits.length <= 11) {
    return digits.replace(
      /(\d{2})(\d{1})(\d{4})(\d{4})/,
      "($1) $2 $3-$4"
    );
  }

  return value;
};

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Handle Actions
  const handleAcceptRequest = async (requestId: string, priceProposed?: number): Promise<void> => {
    try {
      await axios.post(
        `http://localhost:5000/api/requests/${requestId}/respond`,
        {
          action: "accept",  // Definindo a ação como "aceitar"
          requestId: requestId,  // ID da solicitação
          priceProposed: priceProposed,  // Preço proposto (opcional)
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      notifySuccess("Solicitação aceita com sucesso.");
      setRequests((prev) =>
        prev.map((req) =>
          req._id === requestId ? { ...req, status: "accepted" } : req
        )
      );
    } catch (error) {
      console.error("Erro ao aceitar solicitação:", error);
      notifyError("Erro ao aceitar solicitação.");
    }
  };
  const handleRejectRequest = async (requestId: string): Promise<void> => {
    try {
      await axios.post(
        `http://localhost:5000/api/requests/${requestId}/respond`,
        {
          action: "reject",  // Definindo a ação como "rejeitar"
          requestId: requestId,  // ID da solicitação
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      notifySuccess("Solicitação rejeitada com sucesso.");
      setRequests((prev) =>
        prev.map((req) =>
          req._id === requestId ? { ...req, status: "rejected" } : req
        )
      );
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      notifyError("Erro ao rejeitar solicitação.");
    }
  };  
  const handleStarClick = (index: number) => {
    setRating(index + 1);
  };
  const formatCurrency = (value: number, currency: string): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(value);
  };
  const handleCompleteRequest = async (rating: number): Promise<void> => {
    if (!currentRequestId) {
      console.error("requestId is missing!");
      return;
    }
  
    try {
      // Envia a requisição para completar a solicitação com a avaliação (stars)
      await axios.post(
        `http://localhost:5000/api/requests/${currentRequestId}/complete`,  // Endpoint correto para completar a solicitação
        { 
          requestId: currentRequestId,  // ID da solicitação
          stars: rating                 // Avaliação (em estrelas)
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,  // Passando o token de autorização
          },
        }
      );
  
      // Notifica sucesso ao usuário
      notifySuccess("Solicitação completada com sucesso!");
  
      // Atualiza o estado da solicitação para "completed"
      setRequests((prev) =>
        prev.map((req) =>
          req._id === currentRequestId ? { ...req, status: "completed" } : req
        )
      );
  
      // Fechar o modal de avaliação após o sucesso
      closeRatingModal();
    } catch (error) {
      console.error("Erro ao completar solicitação:", error);
      notifyError("Erro ao completar solicitação.");
    }
  }; 
   // Função para animar o saldo da wallet
   const animateBalance = (start: number, end: number) => {
    const duration = 1000; // Duração da animação (1 segundo)
    const stepTime = 10; // Intervalo entre cada incremento
    const increment = (end - start) / (duration / stepTime);

    let current = start;
    const interval = setInterval(() => {
      current += increment;

      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        setDisplayedBalance(end); // Garante o valor final
        clearInterval(interval); // Para a animação
      } else {
        setDisplayedBalance(current);
      }
    }, stepTime);
  };
  
// Calcula o total de ganhos somando os valores das solicitações concluídas
const totalEarning = requests
  .filter((req) => req.status === "completed")
  .reduce((acc, req) => acc + req.totalPrice, 0);


  
  return (
    <div className="profile-container">
      {isWithdrawModalOpen && (
  <div className="withdraw-modal">
    <div className="modal-content">
      <h2>Solicitar Saque</h2>
      {/* Valor do Saque */}
      <div className="input-group">
        <label htmlFor="withdraw-amount">Valor do saque</label>
        <input
          id="withdraw-amount"
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(Number(e.target.value))}
          placeholder="Valor"
        />
      </div>

      {/* Seletor de Forma de Saque */}
      <div className="input-group">
        <label htmlFor="withdraw-method">Forma de saque</label>
        <select
          id="withdraw-method"
          onChange={(e) => setWithdrawMethod(e.target.value)}
        >
          <option value="pix">PIX</option>
          <option value="bank_transfer">Transferência Bancária</option>
        </select>
      </div>

      {/* Campos para Forma de Saque - Transferência Bancária */}
      {withdrawMethod === "bank_transfer" && (
        <div className="bank-info">
          <div className="input-group">
            <label htmlFor="bank">Banco</label>
            <input
              id="bank"
              type="text"
              value={accountInfo?.bank || ""}
              onChange={(e) =>
                setAccountInfo((prev) => ({ ...prev!, bank: e.target.value }))
              }
              placeholder="Banco"
            />
          </div>

          <div className="input-group">
            <label htmlFor="account">Número da conta</label>
            <input
              id="account"
              type="text"
              value={accountInfo?.account || ""}
              onChange={(e) =>
                setAccountInfo((prev) => ({ ...prev!, account: e.target.value }))
              }
              placeholder="Número da conta"
            />
          </div>

          <div className="input-group">
            <label htmlFor="agency">Agência</label>
            <input
              id="agency"
              type="text"
              value={accountInfo?.agency || ""}
              onChange={(e) =>
                setAccountInfo((prev) => ({ ...prev!, agency: e.target.value }))
              }
              placeholder="Agência"
            />
          </div>

          <div className="input-group">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              value={accountInfo?.cpf || ""}
              onChange={(e) =>
                setAccountInfo((prev) => ({ ...prev!, cpf: e.target.value }))
              }
              placeholder="CPF"
            />
          </div>

          <div className="input-group">
            <label htmlFor="name">Nome do titular</label>
            <input
              id="name"
              type="text"
              value={accountInfo?.name || ""}
              onChange={(e) =>
                setAccountInfo((prev) => ({ ...prev!, name: e.target.value }))
              }
              placeholder="Nome do titular"
            />
          </div>
        </div>
      )}

      {/* Campos para Forma de Saque - PIX */}
      {withdrawMethod === "pix" && (
  <div className="pix-info">
    <div className="input-group">
      <label htmlFor="pix-type">Tipo de chave PIX</label>
      <select
        id="pix-type"
        onChange={(e) =>
          setAccountInfo((prev) => ({ ...prev!, keyType: e.target.value }))
        }
      >
        <option value="email">Email</option>
        <option value="phone">Telefone</option>
        <option value="cpf">CPF</option>
        <option value="cnpj">CNPJ</option>
      </select>
    </div>

    <div className="input-group">
      <label htmlFor="pix-key">Chave PIX</label>
      <input
        id="pix-key"
        type="text"
        value={accountInfo?.key || ""}
        onChange={(e) => {
          const value = e.target.value;
          let formattedValue = value;

          // Formatação baseada no tipo de chave PIX
          if (accountInfo?.keyType === "cpf") {
            formattedValue = formatCPF(value);
          } else if (accountInfo?.keyType === "phone") {
            formattedValue = formatPhone(value);
          } else if (accountInfo?.keyType === "email") {
            formattedValue = value; // Não precisa de formatação para email
          }

          setAccountInfo((prev) => ({ ...prev!, key: formattedValue }));
        }}
        placeholder="Insira a chave PIX"
      />
    </div>
  </div>
)}
      {/* Exibe mensagem de erro */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* Botões */}
      <div className="modal-buttons">
  <button onClick={handleWithdraw} disabled={isLoadingWithdraw}>
    {isLoadingWithdraw ? "Processando..." : "Confirmar Saque"}
  </button>
  <button onClick={closeWithdrawModal}>Fechar</button>
</div>

    </div>
  </div>
)}
{/* Modal de Confirmação de Exclusão */}
{isDeleteModalOpen && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Confirmar Fechamento</h3>
      <p>Deseja realmente fechar este serviço?</p>
      <div className="modal-buttons">
        <button onClick={handleDeleteRequest} className="btn confirm">
          Confirmar
        </button>
        <button onClick={closeDeleteModal} className="btn cancel">
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
    {isRatingModalOpen && (
      <div className="rating-modal">
        <div className="modal-content">
          <h2>Avalie o serviço</h2>
          <div className="rating-stars">
  {[...Array(5)].map((_, index) => (
    <FaStar
      key={index}
      className={`star ${rating > index ? "filled" : ""}`}
      onClick={() => handleStarClick(index)}
    />
  ))}
</div>
          <button onClick={() => handleCompleteRequest(rating)}>Enviar Avaliação</button>
          <button onClick={closeRatingModal}>Fechar</button>
        </div>
      </div>
    )}
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Voltar
        </button>
        <h1>Seu Perfil</h1>
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt /> Sair
        </button>
      </div>

      {userData && (
        <div className="user-info">
          <div className="avatar-container">
            <img src={userData.avatar} alt="Avatar do Usuário" className="avatar" />
          </div>
          <h2>{userData.firstName} {userData.lastName}</h2>
          <p>Email: {userData.email}</p>

          {userData.role === "service-provider" && (
  <div className="balance-container">
    <span className="balance-value">
      {formatCurrency(displayedBalance, currencySymbol)}
    </span>
    <div className="wallet-icon" onClick={openWithdrawModal}>
      <FaWallet />
            </div>
            </div>
          )}
        </div>
      )}
{userData?.role === "service-provider" && (
  <div className="statistics-container">
    <h3>Estatísticas</h3>
    <ul>
      <li>
        <strong>Solicitações Concluídas:</strong>{" "}
        {userData.completedRequests || 0}
      </li>
      <li>
        <strong>Avaliação Média:</strong>{" "}
        {(userData.ratingStats?.averageRating || 0).toFixed(1)}{" "}
        <FaStar />
      </li>
      <li>
        <strong>Total de Avaliações:</strong>{" "}
        {userData.ratingStats?.totalRatings || 0}
      </li>
      <li>
        <strong>Total Ganhos:</strong>{" "}
        {formatCurrency(totalEarning, currencySymbol)}
      </li>
    </ul>
  </div>
)}
      <div className="requests-container">
        <h3>{userData?.role === "service-provider" ? "Solicitações para Revisão" : "Suas Solicitações"}</h3>
        {requests.length > 0 ? (
          requests.map((request) => (
            <div key={request._id} className={`request-card ${request.status}`}>
            <div className="request-header">
              {/* Ícone para fechar serviço */}
              {(request.status === "rejected" || request.status === "completed") && (
                <FaTimes
                  className="close-icon"
                  title="Fechar Serviço"
                  onClick={() => openDeleteModal(request._id)}
                />
              )}
          
              <div className="request-avatar">
                <img
                  src={userData?.role === "service-provider" ? "client-avatar.png" : "provider-avatar.png"}
                  alt="Avatar"
                  className="request-avatar-img"
                />
              </div>
          
              <div className="request-details">
                <p>
                  <strong>
                    {userData?.role === "service-provider"
                      ? `${request.user?.firstName || "Nome do cliente"} ${request.user?.lastName || ""}`
                      : `${request.provider?.firstName || "Nome do prestador"} ${request.provider?.lastName || ""}`}
                  </strong>
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {request.status === "pending" && (
                    <span className="status pending">
                      <FaHourglassHalf /> Pendente
                    </span>
                  )}
                  {request.status === "accepted" && (
                    <span className="status accepted">
                      <FaCheckCircle /> Aceito
                    </span>
                  )}
                  {request.status === "rejected" && (
                    <span className="status rejected">
                      <FaTimesCircle /> Rejeitado
                    </span>
                  )}
                  {request.status === "completed" && (
                    <span className="status completed">
                      <FaCheckCircle /> Completado
                    </span>
                  )}
                </p>
              </div>
            </div>
          
            <p><strong>Categoria:</strong> {request.category}</p>
            <p>
              <strong>Endereço:</strong>{" "}
              {request.address
                ? `${request.address.street}, ${request.address.houseNumber}, ${request.address.neighborhood}, ${request.address.city}, ${request.address.state}, ${request.address.country}`
                : "N/A"}
            </p>
            <p><strong>Hora de Início:</strong> {new Date(request.startTime).toLocaleString()}</p>
            <p><strong>Hora de Término:</strong> {new Date(request.endTime).toLocaleString()}</p>
            <p><strong>Preço Total:</strong> ${request.totalPrice?.toFixed(2)}</p>
            <p><strong>Preço por Hora:</strong> ${request.pricePerHour?.toFixed(2)}</p>
          
            {/* Ações adicionais */}
            <div className="request-actions">
              {userData?.role === "service-provider" && request.status === "pending" && (
                <>
                  <button
                    className="btn accept"
                    onClick={() => handleAcceptRequest(request._id)}
                  >
                    Aceitar
                  </button>
                  <button
                    className="btn reject"
                    onClick={() => handleRejectRequest(request._id)}
                  >
                    Rejeitar
                  </button>
                </>
              )}
              {userData?.role === "user" && request.status === "pending" && (
                <button
                  className="btn cancel"
                  onClick={() => handleCancelRequest(request._id)}
                >
                  Cancelar
                </button>
              )}
              {userData?.role === "user" && request.status === "accepted" && (
                <button
                  className="btn complete"
                  onClick={() => openRatingModal(request._id)}
                >
                  Completar
                </button>
              )}
            </div>
          </div>          
          ))
        ) : (
          <p>Não há solicitações para exibir.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
