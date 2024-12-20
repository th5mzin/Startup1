const mongoose = require("mongoose");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// Validação de CPF (Importante no contexto brasileiro)
const validateCPF = (cpf) => {
  const regex = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/;
  if (!regex.test(cpf)) return false;
  // Lógica de validação adicional
  return true;
};

// Esquema de usuário
const userSchema = new mongoose.Schema(
  {
    // Nome e sobrenome são obrigatórios para identificação básica
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    // Email é obrigatório e único para login e notificações
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: (props) => `${props.value} não é um email válido!`,
      },
    },

    // Senha armazenada como hash (processada pelo middleware)
    password: { type: String, required: true },

    // Função do usuário no sistema: cliente ou prestador
    role: { type: String, enum: ["user", "service-provider"], default: "user" },

    // CPF validado no modelo (importante para conformidade no Brasil)
    cpf: {
      type: String,
      validate: {
        validator: validateCPF,
        message: (props) => `${props.value} não é um CPF válido!`,
      },
    },

    // Endereço: Necessário para serviços e localização
    address: {
      zipCode: { type: String, required: true },
      street: { type: String, required: true },
      houseNumber: { type: String, required: true },
      neighborhood: { type: String }, // Opcional
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },

    // Avatar padrão (personalização opcional)
    avatar: { type: String, default: "/images/default-avatar.jpg" },

    // Identificador único para prestadores de serviço
    providerId: { type: String, required: true },
    // Categoria de serviço (aplicável somente para prestadores)
    category: {
      type: String,
      required: function () {
        return this.role === "service-provider";
      },
    },

    // Preço por hora do serviço (somente para prestadores)
    pricePerHour: {
      type: Number,
      required: function () {
        return this.role === "service-provider";
      },
      min: 1,
    },

    // Saldo acumulado (somente para prestadores)
   // Saldo acumulado e controle de liberação
   balance: { type: Number, default: 0, min: 0 },
   pendingBalance: { type: Number, default: 0, min: 0 },
   availableBalance: { type: Number, default: 0, min: 0 },
   

    // Métricas de solicitações concluídas e canceladas
    completedRequests: { type: Number, default: 0 },
    canceledRequests: { type: Number, default: 0 },

    // Estatísticas de avaliação do prestador
    ratingStats: {
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 },
    },

    // Status de ocupação do prestador
    isBusy: { type: Boolean, default: false },

    // Localização geográfica (GeoJSON)
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },

    // Preferências do usuário
    preferences: {
      language: { type: String, default: "pt-BR" },
      currency: { type: String, default: "BRL" },
      theme: { type: String, enum: ["light", "dark"], default: "light" },
    },

    // Verificação de identidade
    identityVerified: {
      isVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
    },

    // Token e expiração para redefinição de senha
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
  },
  { timestamps: true }
);
// Middleware para calcular automaticamente o saldo total antes de salvar
userSchema.pre("save", function (next) {
  this.balance = this.pendingBalance + this.availableBalance;
  next();
});
// Método para liberar saldo pendente
userSchema.methods.releaseBalance = async function () {
  const daysToRelease = this.identityVerified?.isVerified ? 1 : 3;

  // Define a data de liberação (última atualização + dias necessários)
  const releaseDate = new Date(this.updatedAt);
  releaseDate.setDate(releaseDate.getDate() + daysToRelease);

  if (new Date() >= releaseDate) {
    this.availableBalance += this.pendingBalance; // Move o saldo pendente para o disponível
    this.pendingBalance = 0; // Zera o saldo pendente

    console.log(
      `Saldo de R$ ${this.availableBalance.toFixed(2)} liberado para o prestador: ${this.firstName} ${this.lastName}`
    );

    return this.save(); // Salva as alterações no banco
  }

  return null; // Retorna null se a liberação não for possível
};

// Método para adicionar saldo pendente
userSchema.methods.addPendingBalance = function (amount) {
  if (amount < 0) throw new Error("O valor não pode ser negativo.");
  this.pendingBalance += amount;
  return this.save();
};
// Middleware para hash de senha
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await argon2.hash(this.password);
  }
  next();
});

// Método para verificar senha
userSchema.methods.isPasswordValid = async function (password) {
  return await argon2.verify(this.password, password);
};

// Método para gerar um token JWT
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

// Criar o modelo
const User = mongoose.model("User", userSchema);

module.exports = User;
