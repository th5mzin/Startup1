const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Verifique se o caminho está correto

// Rota de login
router.post('/login', authController.loginUser); // Verifique se a função foi importada corretamente

// Rota de registro
router.post('/register', authController.registerUser); // Verifique se a função foi importada corretamente

module.exports = router;
