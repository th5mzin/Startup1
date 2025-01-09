const cron = require("node-cron");
const releasePendingBalance = require("./releaseBalanceJob");

// Agendamento para rodar diariamente às 00:00
cron.schedule("0 0 * * *", async () => {
  console.log("Executando cron job de liberação de saldo...");
  await releasePendingBalance();
});

console.log("Cron job para liberação de saldo configurado.");
