const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Verifique se o caminho está correto

// Rota de login
router.post('/login', authController.loginUser ); // Verifique se a função foi importada corretamente

// Rota de registro com validação
router.post('/register', authController.validateUser , authController.registerUser ); // Adicionando validação

module.exports = router;