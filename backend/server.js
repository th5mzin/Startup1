const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Se necessário

dotenv.config();

app.use(cors());
app.use(express.json()); // Para ler o corpo das requisições em JSON

// Conectar ao banco de dados MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Conectado ao MongoDB');
}).catch(err => {
  console.error('Erro de conexão com o MongoDB:', err);
});

// Usar as rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Se necessário

// Definir a porta para o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
