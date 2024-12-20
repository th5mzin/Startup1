require('dotenv').config(); // Certifique-se de que as variáveis de ambiente sejam carregadas no início

const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require("express-rate-limit");
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require("./routes/RequestRoutes");
require("./jobs/cronJobs"); // Ajuste o caminho conforme necessário

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Verificação da configuração do Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Chave STRIPE_SECRET_KEY não configurada no .env");
} else {
  console.log("STRIPE_SECRET_KEY configurada com sucesso.");
}

// Configuração de rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: "Muitas requisições, tente novamente mais tarde.",
});

// Middlewares globais
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173', // Altere para o domínio permitido
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
}));
app.use(helmet()); // Segurança adicional com cabeçalhos HTTP
app.use(express.json()); // Para ler o corpo das requisições em JSON
app.use(morgan('combined')); // Logs de requisições no console
app.use(compression()); // Compressão de respostas HTTP
app.use(mongoSanitize()); // Proteção contra NoSQL Injection

// Conexão com o MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado ao MongoDB');
}).catch(err => {
  console.error('Erro de conexão com o MongoDB:', err);
});

// Rotas
app.use("/api/requests", apiLimiter, requestRoutes);
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/user', apiLimiter, userRoutes);

// Configuração da porta do servidor
const PORT = process.env.PORT || 5000;

// Teste de conexão com o banco antes de inicializar o servidor
mongoose.connection.on('connected', () => {
  console.log('Conexão ao MongoDB estabelecida com sucesso.');
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});

mongoose.connection.on('error', (err) => {
  console.error('Erro de conexão ao MongoDB:', err);
});
