const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    // Usuário que criou a solicitação
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    providerId: { type: String},
    providerFirstName: { type: String, required: false },
providerLastName: { type: String, required: false },
providerEmail: { type: String, required: false },
clientFirstName: { type: String, required: false },
clientLastName: { type: String, required: false },
clientEmail: { type: String, required: false },


    // Categoria do serviço (isso é único por solicitação, faz sentido manter aqui)
    category: { type: String, required: true },

    // Preço por hora para o serviço
    pricePerHour: {
      type: Number,
      required: true,
      min: 1, // Garante valores positivos
    },

    // Total de horas para o serviço
    totalHours: {
      type: Number,
      required: true,
      min: 1, // Mínimo de 1 hora
    },

    // Preço total (calculado no momento da criação da solicitação)
    totalPrice: {
      type: Number,
      required: true,
      min: 1, // Garantia de valor positivo
    },

    // Endereço como um objeto
    address: {
      zipCode: { type: String, required: true },
      street: { type: String, required: true },
      houseNumber: { type: String, required: true },
      neighborhood: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },

    // Localização
    location: {
      lat: { type: Number, required: true }, // Latitude
      lng: { type: Number, required: true }, // Longitude
    },

    // Distância entre cliente e prestador (calculada na criação da solicitação)
    distance: { type: Number, required: false },

    // Prestador selecionado para a solicitação (relacionado ao `User `)
    selectedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Só preenchido após seleção
    },

    // Respostas recebidas dos prestadores
    responses: [
      {
        provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, maxlength: 200 }, // Mensagem opcional
        priceProposed: { type: Number, min: 0 }, // Preço proposto, se aplicável
        responseTime: { type: Date, default: Date.now },
      },
    ],

    // Mensagens trocadas na solicitação
    messages: [
      {
        from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, maxlength: 500 },
        sentAt: { type: Date, default: Date.now },
      },
    ],

    // Horário agendado para o serviço
    schedule: {
      startTime: { type: Date, required: true },
      endTime: { type: Date, required: true },
    },

    // Status da solicitação
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "disputed", "canceled"],
      default: "pending",
    },

    // Informações de disputa
    dispute: {
      isDisputed: { type: Boolean, default: false },
      reason: { type: String, maxlength: 200 },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Usuário que abriu a disputa
      resolution: { type: String, maxlength: 200 },
      status: { type: String, enum: ["open", "resolved"], default: "open" },
    },

    // Informações de cancelamento
    cancellation: {
      isCanceled: { type: Boolean, default: false },
      canceledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, maxlength: 200 },
      canceledAt: { type: Date },
    },

    // Dados relacionados ao pagamento
    payment: {
      isReleased: { type: Boolean, default: false },
      method: {
        type: String,
        enum: ["credit_card", "pix"],
        default: "credit_card",
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
      },
      paymentIntentId: { type: String }, // ID gerado pela Stripe
      releasedAt: { type: Date },
    },    
    paymentCompletedAt: { type: Date },

    // Avaliações registradas para o prestador após o serviço
    ratings: [
      {
        rating: { type: Number, min: 0, max: 5, required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Notificações relacionadas à solicitação
    notifications: [
      {
        sentTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["request_created", "request_accepted", "payment_released", "dispute_created"],
        },
        sentAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],

    // Prioridade da solicitação
    priority: { type: String, enum: ["normal", "urgent"], default: "normal" },

    // Data de criação da solicitação
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Cria automaticamente os campos createdAt e updatedAt
  }
);

// Criar o modelo
const Request = mongoose.model("Request", requestSchema);

module.exports = Request;