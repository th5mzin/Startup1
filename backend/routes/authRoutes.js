const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyToken } = require('../controllers/authController');
const { body } = require('express-validator');

// Middleware de validação
const validateUser = [
  body('email').isEmail().withMessage('Email inválido.'),
  body('password').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres.'),
];

// Rotas de autenticação

// Rota de registro de usuário
router.post('/register', validateUser, registerUser);

// Rota de login de usuário
router.post('/login', validateUser, loginUser);

// Rota para verificar token JWT
router.get('/verify', verifyToken);

module.exports = router;
