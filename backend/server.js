require("dotenv").config(); // Carregar variáveis de ambiente do .env

const express = require("express");
const http = require("http"); // Servidor HTTP
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const app = express();

// Configuração do Stripe
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

// Verificação da configuração do Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Chave STRIPE_SECRET_KEY não configurada no .env");
} else {
  console.log("STRIPE_SECRET_KEY configurada com sucesso.");
}

// Configuração de segurança
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: "Muitas requisições, tente novamente mais tarde.",
});

// Middlewares globais
app.use(
  cors({
    origin: "http://localhost:5173", // Substitua pelo domínio do frontend
    methods: "GET,POST,PUT,DELETE", // Métodos permitidos
    allowedHeaders: "Content-Type,Authorization", // Cabeçalhos permitidos
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan("combined"));
app.use(compression());
app.use(mongoSanitize());

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Conectado ao MongoDB em: ${process.env.MONGODB_URI}`);
  })
  .catch((err) => {
    console.error("Erro de conexão com o MongoDB:", err);
  });

// Rotas
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/RequestRoutes");
const chatRoutes = require("./routes/chatRoutes");

app.use("/api/auth", apiLimiter, authRoutes);
app.use("/api/user", apiLimiter, userRoutes);
app.use("/api/requests", apiLimiter, requestRoutes);
app.use("/api/chats", apiLimiter, chatRoutes);

// Criar servidor HTTP
const server = http.createServer(app);

// Inicializar o servidor após conectar ao MongoDB
const PORT = process.env.PORT || 5000;

mongoose.connection.on("connected", () => {
  console.log("Conexão ao MongoDB estabelecida com sucesso.");
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});

mongoose.connection.on("error", (err) => {
  console.error("Erro de conexão ao MongoDB:", err);
});
