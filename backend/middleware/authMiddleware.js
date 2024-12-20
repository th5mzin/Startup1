const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header('Authorization'); // Obtém o cabeçalho de autorização

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.replace('Bearer ', ''); // Remove o prefixo 'Bearer'

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca o usuário no banco de dados com o ID decodificado
    const user = await User.findById(decoded.id);
    if (!user) {
      console.warn(`User with ID ${decoded.id} not found`);
      return res.status(401).json({ message: 'User not found' });
    }

    // Adiciona as informações do usuário na requisição para uso nas rotas
    req.user = user;

    next(); // Passa para o próximo middleware ou controlador
  } catch (err) {
    console.error('Erro de autenticação:', err);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }

    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
