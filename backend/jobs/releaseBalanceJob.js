const cron = require("node-cron");
const User = require("../models/User");

// Liberação de saldo pendente para saldo disponível
const releasePendingBalances = async () => {
  try {
    // Obtém todos os prestadores de serviço com saldo pendente
    const providers = await User.find({ role: "service-provider", pendingBalance: { $gt: 0 } });

    for (const provider of providers) {
      await provider.releaseBalance(); // Chama o método do modelo
    }

    console.log("Processo de liberação de saldo pendente concluído.");
  } catch (error) {
    console.error("Erro ao liberar saldo pendente:", error);
  }
};

// Agendamento do cron job para rodar diariamente à meia-noite
cron.schedule("0 0 * * *", releasePendingBalances);
