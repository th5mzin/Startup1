const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },  // Referência ao provedor do serviço
  pricePerHour: { type: Number, required: true },  // Preço por hora
  images: [{ type: String }],  // Imagens (até 5 imagens)
  category: { type: String, required: true },  // Categoria predefinida do serviço
  location: {
    country: { type: String, required: true },  // País
    state: { type: String, required: true },    // Estado
    city: { type: String, required: true },     // Cidade
  },
  serviceDuration: { type: Number, required: true },  // Duração total do serviço (em horas)
  maxDuration: { type: Number, default: 240 }, // Limite máximo de horas (30 dias x 8h)
  startDate: { type: Date, required: true }, // Data de início do serviço
  endDate: { type: Date, required: true },   // Data de término (calculado com base na duração)
  status: {
    type: String,
    enum: ['paid', 'in progress', 'completed', 'pending', 'cancelled'],  // Status do serviço
    default: 'paid',
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },  // Usuário que fez a avaliação
    rating: { type: Number, required: true, min: 1, max: 5 },  // Avaliação de 1 a 5
    comment: { type: String, required: false },  // Comentário da avaliação
    createdAt: { type: Date, default: Date.now }  // Data da avaliação
  }],
  averageRating: { type: Number, default: 0 },  // Média das avaliações
  createdAt: { type: Date, default: Date.now },  // Data de criação
  updatedAt: { type: Date, default: Date.now },  // Data de atualização
  deletedAt: { type: Date, default: null },  // Para rastrear a exclusão
});

// Índice para expiração de documentos
serviceSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 1296000 });  // Expira após 15 dias

// Método para calcular a média das avaliações
serviceSchema.methods.calculateAverageRating = function () {
  const ratings = this.ratings;
  if (ratings.length === 0) return 0;
  
  const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
  const average = sum / ratings.length;
  
  return average;
};

// Middleware para atualizar a média das avaliações e a data de atualização antes de salvar
serviceSchema.pre('save', function (next) {
  this.averageRating = this.calculateAverageRating();
  this.updatedAt = Date.now(); // Atualiza a data de atualização
  next();
});

// Criação do modelo de serviço
const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;