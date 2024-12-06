const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Função para conectar ao banco de dados MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,  // Só se estiver usando versões mais antigas do MongoDB
      useFindAndModify: false,  // Para evitar o deprecated findAndModify
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Encerra o processo se não conseguir conectar
  }
};

module.exports = connectDB;
