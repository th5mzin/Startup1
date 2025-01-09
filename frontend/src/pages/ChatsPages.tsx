import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaPaperPlane,
  FaPaperclip,
  FaFileUpload,
  FaClipboardList,
  FaTrash,
  FaTimes,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";
import axios from "axios";
import { notifyError, notifySuccess } from "../utils/notifications";
import "./ChatsPage.css";
import Modal from "./Modal";


interface Chat {
  id: string;
  providerName: string;
  providerAvatar: string;
  lastMessage: string;
  lastMessageAt: string; // Nome igual ao retorno do backend
  isSeen: boolean;
}
interface Participant {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  role: string; // user ou service-provider
}

interface Provider {
  _id: string;
  providerId: string;
  firstName: string;
  lastName: string;
  category: string;
  pricePerHour: number;
  formattedAddress: string;
  avatar: string;
  email: string;
  location: {
    lat: number;
    lng: number;
  };
  ratingStats: {
    averageRating: number;
    totalRatings: number;
  };
  servicesCompleted: number;
  isBusy: boolean;
}
interface Message {
  id: string;
  sender: "client" | "provider";
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  serviceRequestId?: string;
  timestamp: string;
  isSeen: boolean;
  isDeleted: boolean;
  isEditing?: boolean; // Nova propriedade opcional
  status?: "sent" | "delivered" | "read" | "accepted" | "rejected"; // Adicione aqui
}


const ChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatList, setShowChatList] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setShowChatList(window.innerWidth > 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const toggleChatList = () => {
    setShowChatList((prev) => !prev);
  };

  const toggleMessageDropdown = (messageId: string) => {
    setActiveDropdown((prev) => (prev === messageId ? null : messageId));
  };  
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };
  const toggleGlobalDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Protege a rota e gerencia query string para criação ou recuperação de chat
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      notifyError("Você precisa estar logado para acessar esta página.");
      navigate("/");
      return;
    }

    const queryParams = new URLSearchParams(location.search);
    const providerId = queryParams.get("providerId");

    if (providerId) {
      createOrGetChat(providerId);
    } else {
      fetchChats();
    }
  }, [navigate, location]);

  // Função para criar ou recuperar um chat diretamente com o providerId
  const toggleEditMessage = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, isEditing: !msg.isEditing }
          : { ...msg, isEditing: false } // Garante que outras mensagens não estejam em modo de edição
      )
    );
  };  
  const handleEditInput = (text: string, messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, text } : msg
      )
    );
  };  
  const handleSaveEdit = async (messageId: string) => {
    const editedMessage = messages.find((msg) => msg.id === messageId);
    if (!editedMessage || !editedMessage.text) return;
  
    try {
      // Envia a edição para o backend
      await axios.put(
        `http://localhost:5000/api/chats/edit/${activeChat?.id}/${messageId}`,
        { content: editedMessage.text },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
  
      // Atualiza o estado local
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, isEditing: false } : msg
        )
      );
      notifySuccess("Mensagem editada com sucesso.");
    } catch (error) {
      notifyError("Erro ao salvar a edição.");
      console.error("Erro ao salvar a edição:", error);
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChat) return;
  
    try {
      await axios.delete(
        `http://localhost:5000/api/chats/delete-message/${activeChat.id}/${messageId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      notifySuccess("Mensagem deletada com sucesso.");
    } catch (error) {
      notifyError("Erro ao deletar mensagem.");
      console.error(error);
    }
  };  
  const createOrGetChat = async (providerId: string) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/chats/start",
        { providerId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
  
      const chat = {
        id: response.data.id,
        providerName: response.data.providerName,
        providerAvatar: response.data.providerAvatar,
        lastMessage: response.data.lastMessage || "Nenhuma mensagem ainda.",
        lastMessageAt: new Date(response.data.lastMessageAt).toLocaleString(),
        isSeen: false,
      };
  
      setChats((prevChats) => [...prevChats, chat]);
      setActiveChat(chat);
      setMessages([]); // Novo chat começa sem mensagens
    } catch (error) {
      notifyError("Erro ao iniciar ou recuperar chat.");
      console.error(error);
    }
  };
  const handleChatSelection = async (chat: Chat) => {
    setMessages([]); // Limpa mensagens antigas
    setActiveChat(chat);
  
    try {
      const response = await axios.get<Message[]>(
        `http://localhost:5000/api/chats/messages/${chat.id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
  
      // Certifique-se de que mensagens é um array
      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      setMessages([]); // Garante que mensagens será um array vazio
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        notifyError("Chat não encontrado ou ID inválido.");
      } else {
        notifyError("Erro ao carregar mensagens.");
      }
    }
  };
  
  
  useEffect(() => {
   // Função para buscar mensagens de um chat
   const fetchMessages = async (chatId: string) => {
    try {
      const response = await axios.get<Message[]>(
        `http://localhost:5000/api/chats/messages/${chatId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessages(response.data);
    } catch (error) {
      notifyError("Erro ao buscar mensagens.");
      console.error(error);
    }
  };  
  if (activeChat?.id) {
    const interval = setInterval(() => {
      fetchMessages(activeChat.id);
    }, 3000); // Atualiza a cada 3 segundos
    return () => clearInterval(interval);
  }
}, [activeChat]);

  // Função para carregar todos os chats do usuário
  const fetchChats = async () => {
    try {
      const response = await axios.get<{
        _id: string;
        participants: Participant[];
        lastMessage: string;
        lastMessageAt: string;
      }[]>("http://localhost:5000/api/chats/list", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      const userId = localStorage.getItem("userId");
  
      const formattedChats = response.data
        .map((chat) => {
          if (!chat.participants || chat.participants.length === 0) {
            console.warn(`Chat com ID ${chat._id} não possui participantes.`);
            return null;
          }
  
          // Identificar outro participante
          const otherParticipant = chat.participants.find(
            (participant) => participant.user._id !== userId
          );
  
          if (!otherParticipant) {
            console.warn(
              `Nenhum outro participante encontrado para o chat com ID ${chat._id}.`
            );
            return null;
          }
  
          return {
            id: chat._id,
            providerName: `${otherParticipant.user.firstName || "Desconhecido"} ${
              otherParticipant.user.lastName || ""
            }`.trim(),
            providerAvatar: otherParticipant.user.avatar || "/images/default-avatar.jpg",
            lastMessage: chat.lastMessage || "Nenhuma mensagem.",
            lastMessageAt: new Date(chat.lastMessageAt).toLocaleString(),
            isSeen: false,
          };
        })
        .filter(Boolean); // Remove valores `null`
  
      setChats(formattedChats as Chat[]);
    } catch (error) {
      notifyError("Erro ao carregar os chats.");
      console.error(error);
    }
  };
  
  const [isTyping, setIsTyping] = useState(false);
  // Enviar uma nova mensagem
  const handleSendMessage = async () => {
    if (!activeChat?.id || !newMessage.trim()) return;
  
    try {
      const response = await axios.post(
        `http://localhost:5000/api/chats/send/${activeChat.id}`,
        { content: newMessage },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (error) {
      notifyError("Erro ao enviar mensagem.");
      console.error(error);
    }
  };  
  // Fazer upload de um arquivo
  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/chats/${activeChat?.id}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessages([...messages, response.data]);
      notifySuccess("Arquivo enviado com sucesso.");
    } catch (error) {
      notifyError("Erro ao enviar arquivo.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // Aceitar solicitação de serviço
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await axios.post(
        `http://localhost:5000/api/requests/respond`,
        { action: "accept", requestId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
  
      setMessages((prev) =>
        prev.map((msg) =>
          msg.serviceRequestId === requestId ? { ...msg, status: "accepted" } : msg
        )
      );
  
      notifySuccess("Solicitação aceita com sucesso.");
    } catch (error) {
      console.error("Erro ao aceitar solicitação:", error);
      notifyError("Erro ao aceitar solicitação.");
    }
  };  
  const handleRejectRequest = async (requestId: string) => {
    try {
      await axios.post(
        `http://localhost:5000/api/requests/respond`,
        { action: "reject", requestId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
  
      setMessages((prev) =>
        prev.map((msg) =>
          msg.serviceRequestId === requestId ? { ...msg, status: "rejected" } : msg
        )
      );
  
      notifySuccess("Solicitação rejeitada com sucesso.");
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      notifyError("Erro ao rejeitar solicitação.");
    }
  };
  // Renderizar mensagens
  const renderMessages = () => {
    return messages.map((msg) => (
      <div
        key={msg.id}
        className={`message-bubble ${msg.sender === "client" ? "client" : "provider"}`}
      >
        {/* Tratamento para mensagens deletadas */}
        {msg.isDeleted ? (
          <p className="deleted-message">Mensagem deletada</p>
        ) : (
          <>
            {/* Renderiza mensagem em modo de edição */}
            {msg.isEditing ? (
              <input
                className="edit-message-input"
                value={msg.text || ""}
                onChange={(e) => handleEditInput(e.target.value, msg.id)}
                onBlur={() => handleSaveEdit(msg.id)}
                autoFocus
              />
            ) : (
              <>
                {/* Renderiza texto da mensagem ou alerta de mensagem sem conteúdo */}
                {msg.text ? (
                  <p className="message-text">{msg.text}</p>
                ) : (
                  <p className="message-text empty-content">Mensagem sem conteúdo</p>
                )}
                {/* Renderiza imagem, se houver */}
                {msg.imageUrl && <img src={msg.imageUrl} alt="Imagem enviada" />}
                {/* Renderiza áudio, se houver */}
                {msg.audioUrl && <audio controls src={msg.audioUrl} />}
                {/* Exibe solicitação de serviço, se houver */}
                {msg.serviceRequestId && (
                  <div className="service-request">
                    <p>
                      <strong>Solicitação de Serviço</strong>
                    </p>
                    <div className="actions">
                      <button
                        className="accept-btn"
                        onClick={() => handleAcceptRequest(msg.serviceRequestId!)}
                      >
                        <FaCheck /> Aceitar
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectRequest(msg.serviceRequestId!)}
                      >
                        <FaTimes /> Rejeitar
                      </button>
                    </div>
                  </div>
                )}
                {/* Menu de ações para mensagem */}
                <div className="dropdown-container">
                  <button
                    className="dropdown-trigger"
                    onClick={() => toggleMessageDropdown(msg.id)}
                    title="Mais opções"
                  >
                    &#x2026;
                  </button>
                  {activeDropdown === msg.id && (
                    <div className="dropdown-content">
                      <button onClick={() => toggleEditMessage(msg.id)}>
                        <FaCheck /> Editar
                      </button>
                      <button onClick={() => navigator.clipboard.writeText(msg.text || "")}>
                        <FaClipboardList /> Copiar
                      </button>
                      <button onClick={() => handleDeleteMessage(msg.id)}>
                        <FaTrash /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {/* Exibição de timestamp */}
            <span className="timestamp">
              {msg.timestamp && !isNaN(new Date(msg.timestamp).getTime())
                ? new Date(msg.timestamp).toLocaleTimeString()
                : "Horário inválido"}
              <span className={`status-icon ${msg.status}`}>
                {msg.status === "sent" && <FaCheck className="gray" />}
                {msg.status === "delivered" && (
                  <>
                    <FaCheck className="gray" /> <FaCheck className="gray" />
                  </>
                )}
                {msg.status === "read" && (
                  <>
                    <FaCheck className="blue" /> <FaCheck className="blue" />
                  </>
                )}
              </span>
            </span>
          </>
        )}
      </div>
    ));
  };  

  return (
      <div className="chats-page">
        {isMobile && !showChatList && (
          <button className="toggle-chat-list-btn" onClick={toggleChatList}>
            Ver Lista de Bate-Papos
          </button>
        )}
    
    {showChatList && (
  <div className={`chat-list ${isMobile && !showChatList ? "hidden" : ""}`}>
    <h2>Seus Bate-Papos</h2>
    {chats.map((chat) => (
      <div
        key={chat.id}
        className={`chat-item ${activeChat?.id === chat.id ? "active" : ""}`}
        onClick={() => {
          handleChatSelection(chat);
          if (isMobile) setShowChatList(false);
        }}
      >
        <img src={chat.providerAvatar} alt={chat.providerName} className="avatar" />
        <div className="chat-details">
          <h4>{chat.providerName}</h4>
          <p className="last-message">{chat.lastMessage}</p>
          <span className="last-message-time">{chat.lastMessageAt}</span>
        </div>
      </div>
    ))}
  </div>
)}

    
        {showModal && selectedProvider && (
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            selectedProvider={selectedProvider}
            totalPrice={0} // Preço será definido no modal
            userAddress="" // Atualizar conforme necessário
            userLocation={{ lat: null, lng: null }} // Atualizar conforme necessário
          />
        )}
    
        <div className="chat-window">
          {activeChat ? (
            <>
              <div className="chat-header">
                <img src={activeChat?.providerAvatar} alt={activeChat?.providerName} />
                <h3>{activeChat?.providerName}</h3>
                {isMobile && (
                  <button className="back-to-list-btn" onClick={toggleChatList}>
                    Voltar
                  </button>
                )}
              </div>
              <div className="messages-container">
  {Array.isArray(messages) && messages.length > 0 ? (
    renderMessages()
  ) : (
    <p className="no-messages">Nenhuma mensagem neste chat. Seja o primeiro a enviar!</p>
  )}
</div>



              <div className="message-input">
                <div className="dropdown">
                  <button className="dropdown-btn" onClick={toggleGlobalDropdown}>
                    <FaPaperclip title="Mais Opções" />
                  </button>
                  {dropdownOpen && (
                    <div className="dropdown-content">
                      <button
                        onClick={() => {
                          if (!activeChat) {
                            notifyError("Selecione um bate-papo para solicitar um serviço.");
                            return;
                          }
                          setSelectedProvider({
                            _id: activeChat.id,
                            providerId: activeChat.id,
                            firstName: activeChat.providerName.split(" ")[0],
                            lastName: activeChat.providerName.split(" ").slice(1).join(" ") || "",
                            category: "Serviço",
                            pricePerHour: 0,
                            formattedAddress: "Endereço do Provedor",
                            avatar: activeChat.providerAvatar || "/images/default-avatar.jpg",
                            email: "email@example.com",
                            location: { lat: 0, lng: 0 },
                            ratingStats: { averageRating: 0, totalRatings: 0 },
                            servicesCompleted: 0,
                            isBusy: false,
                          });
                          setShowModal(true);
                        }}
                      >
                        <FaClipboardList title="Solicitar Serviço" />
                      </button>
                      <button onClick={() => fileInputRef.current?.click()}>
                        <FaFileUpload title="Enviar Arquivo" />
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  disabled={uploading}
                />
    
                <div className="typing-indicator">{isTyping && "Digitando..."}</div>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Digite uma mensagem..."
                  maxLength={2500}
                  disabled={uploading}
                />
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={uploading || !newMessage.trim()}
                >
                  {uploading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-chat">
              <h3>Selecione um bate-papo para começar</h3>
            </div>
          )}
        </div>
      </div>
    );
    
};

export default ChatsPage;
