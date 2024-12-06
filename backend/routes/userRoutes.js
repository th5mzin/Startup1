const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Controlador de usuário

// Rotas para o usuário
router.get('/:id', userController.getUserById);  // Pegar usuário por ID
router.put('/:id', userController.updateUser);  // Atualizar usuário
router.delete('/:id', userController.deleteUser);  // Deletar usuário
router.get('/', userController.getAllUsers);  // Listar todos os usuários
router.get('/profile', userController.getProfile);  // Perfil do usuário logado

module.exports = router;
