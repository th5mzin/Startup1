const mongoose = require("mongoose");

// Esquema para mensagens
const MessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { _id: true } // Mantém os IDs únicos das mensagens
);

// Esquema para participantes
const ParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "service-provider"], required: true },
  },
  { _id: false } // Evita IDs duplicados para participantes
);

// Esquema para informações do provedor
const ProviderInfoSchema = new mongoose.Schema(
  {
    email: { type: String, required: false },
    address: { type: String, default: "Endereço não disponível" },
  },
  { _id: false } // Evita IDs duplicados para dados do provedor
);

// Esquema principal do chat
const ChatSchema = new mongoose.Schema(
  {
    participants: [ParticipantSchema], // Lista de participantes com seus papéis
    providerInfo: ProviderInfoSchema, // Informações do provedor (e-mail e endereço)
    messages: [MessageSchema], // Histórico de mensagens no chat
    lastMessage: { type: String, default: "Nenhuma mensagem ainda." }, // Última mensagem do chat
    lastMessageAt: { type: Date, default: Date.now }, // Data da última mensagem
    isPinned: { type: Boolean, default: false }, // Indica se o chat está fixado
  },
  { timestamps: true } // Adiciona `createdAt` e `updatedAt` automaticamente
);

module.exports = mongoose.model("Chat", ChatSchema);
