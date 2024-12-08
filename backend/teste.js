const argon2 = require('argon2');

async function verifyHash() {
  const hash = '$argon2id$v=19$m=65536,t=3,p=4$R4Pz+D0uKQp7tnC22/flIw$XKn9UA9rN94IOctK8wZJVmPoWwLXorZtx5Wh9pP+MRQ';
  const password = 'Kinger*23';
  const isMatch = await argon2.verify(hash, password);
  console.log('Comparação manual:', isMatch);
}

verifyHash();
