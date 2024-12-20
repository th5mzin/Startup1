const express = require("express");
const router = express.Router();
const {
  getProfile,
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware"); // Middleware para autenticação

// Rota para obter o perfil do usuário autenticado
router.get("/profile", authMiddleware, getProfile);

// Rota para obter informações de um usuário por ID
router.get("/:id", authMiddleware, getUserById);

// Rota para atualizar informações de um usuário
router.put("/:id", authMiddleware, updateUser);

// Rota para deletar um usuário
router.delete("/:id", authMiddleware, deleteUser);

// Rota para listar todos os usuários (somente para administradores)
router.get("/", authMiddleware, getAllUsers);

module.exports = router;
