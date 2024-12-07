const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
      enum: ['user', 'service-provider', 'admin'], // Adicionando 'admin' como um papel
      required: true,
      default: 'user', // Define 'user' como padrão
    },
    avatar: { type: String, default: '/images/default-avatar.jpg' }, // Avatar do usuário
    country: { type: String, required: true }, // País do usuário
    city: { type: String, required: true }, // Cidade do usuário
    state: { type: String, required: true }, // Estado do usuário
    cpf: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^\d{11}$/.test(v); // CPF com 11 dígitos
        },
        message: (props) => `${props.value} não é um CPF válido!`,
      },
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Método para comparar a senha com a criptografada
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Método para atualizar a senha
userSchema.methods.updatePassword = async function (currentPassword, newPassword) {
  const isMatch = await this.comparePassword(currentPassword);
  if (!isMatch) throw new Error('Senha atual incorreta');

  // Criptografar a nova senha
  this.password = await bcrypt.hash(newPassword, 10);
  await this.save();
};

// Middleware para criptografar a senha antes de salvar no banco
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  console.log('Hashing senha para o usuário:', this.email); // Log para depuração
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Método para gerar um token de verificação de email
userSchema.methods.generateVerificationToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Criação do modelo de usuário
const User = mongoose.model('User', userSchema);

module.exports = User;
