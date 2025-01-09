const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  startChat,
  sendMessage,
  editMessage,
  listMessages,
  deleteMessage,
  listUserChats,
  deleteChat,
  markMessagesAsRead,
  searchMessages,
  listChatsByKeyword,
  pinChat,
  unpinChat,
} = require("../controllers/ChatController");

// Criar ou recuperar um chat entre dois usuários
router.post("/start", authMiddleware, startChat);

// Listar todos os chats do usuário logado
router.get("/list", authMiddleware, listUserChats);

// Listar mensagens de um chat
router.get("/messages/:chatId", authMiddleware, listMessages);

// Enviar uma mensagem em um chat específico
router.post("/send/:chatId", authMiddleware, sendMessage);

// Editar uma mensagem específica em um chat
router.put("/edit/:chatId/:messageId", authMiddleware, editMessage);

// Buscar mensagens por palavra-chave em um chat
router.get("/messages/search/:chatId", authMiddleware, searchMessages);

// Buscar chats por palavra-chave no nome dos participantes ou conteúdo
router.get("/search", authMiddleware, listChatsByKeyword);

// Marcar todas as mensagens de um chat como lidas
router.put("/mark-read/:chatId", authMiddleware, markMessagesAsRead);

// Excluir uma mensagem específica de um chat
router.delete("/delete-message/:chatId/:messageId", authMiddleware, deleteMessage);

// Excluir um chat completo
router.delete("/delete/:chatId", authMiddleware, deleteChat);

// Fixar um chat
router.put("/pin/:chatId", authMiddleware, pinChat);

// Desfixar um chat
router.put("/unpin/:chatId", authMiddleware, unpinChat);

module.exports = router;
