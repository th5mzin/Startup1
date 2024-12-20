const mongoose = require("mongoose");
const User = require("./models/User"); // Importa o modelo

const updateProviders = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/startup1", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Conectado ao MongoDB");

    // Atualiza todos os providers adicionando o campo com valor padrão
    const result = await User.updateMany(
      { role: "service-provider" }, // Filtra apenas os providers
      { $set: { isBalanceAvailableForWithdrawal: true } } // Adiciona o novo campo
    );

    console.log(`Atualizados ${result.modifiedCount} documentos.`);
    mongoose.disconnect();
  } catch (error) {
    console.error("Erro ao atualizar documentos:", error);
  }
};

updateProviders();
