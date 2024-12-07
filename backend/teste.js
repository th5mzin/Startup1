const bcrypt = require('bcryptjs');

(async () => {
  const senha = 'Hungerio*2';
  const hash = await bcrypt.hash(senha, 10);
  console.log('Hash (bcryptjs):', hash);

  const resultado = await bcrypt.compare(senha, hash);
  console.log('Resultado da comparação (bcryptjs):', resultado);
})();
