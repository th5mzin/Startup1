const mongoose = require('mongoose');
const argon2 = require('argon2'); // Importando o argon2
const jwt = require('jsonwebtoken');

// Definindo o esquema do usuário
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} não é um email válido!`,
      },
    },
    password: { type: String, required: true }, // Senha do usuário (será criptografada)
    role: {
      type: String,
      enum: ['user', 'service-provider'], // Removendo o 'admin' do modelo de registro
      default: 'user', // O papel padrão será 'user'
    },
    avatar: { type: String, default: '/images/default-avatar.jpg' },
    country: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    cpf: { type: String }, // CPF é opcional
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }
);

// Função para hash da senha antes de salvar o usuário
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    try {
      const hashedPassword = await argon2.hash(this.password);
      this.password = hashedPassword; // Substituindo a senha pelo hash
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Método para comparar a senha fornecida com o hash no banco
userSchema.methods.isPasswordValid = async function (password) {
  return await argon2.verify(this.password, password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
