const mongoose = require('mongoose');

// Definindo o esquema do serviço
const serviceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  category: { type: String, required: true },
  location: {
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
  },
  dispute: {
    isDisputed: { type: Boolean, default: false },
    reason: { type: String },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolution: { type: String },
    status: { type: String, enum: ["open", "resolved", "rejected"], default: "open" },
    createdAt: { type: Date },
  },
  
  startTime: { type: String}, // Horário de início (formato HH:mm)
  endTime: { type: String}, // Horário de término (formato HH:mm)
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

// Índice para expiração de documentos
serviceSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 1296000 });

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
  this.updatedAt = Date.now();
  next();
});

// Criação do modelo de serviço
const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
module.exports = Service;
