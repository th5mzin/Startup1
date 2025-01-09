const Chat = require("../models/Chat");
const User = require("../models/User");
const mongoose = require("mongoose");

// Criar ou recuperar um chat entre dois usuários
const startChat = async (req, res) => {
  try {
    const { providerId } = req.body; // ID do prestador
    const userId = req.user._id; // ID do usuário logado

    // Verifica se o usuário logado é válido
    const user = await User.findById(userId);
    if (!user || user.role !== "user") {
      return res.status(403).json({ message: "Apenas usuários podem iniciar chats." });
    }

    // Verifica se o providerId é válido
    const provider = await User.findById(providerId);
    if (!provider || provider.role !== "service-provider") {
      return res.status(404).json({ message: "Provedor de serviço não encontrado." });
    }

    // Busca ou cria um novo chat
    let chat = await Chat.findOne({
      participants: {
        $all: [
          { user: userId, role: "user" },
          { user: providerId, role: "service-provider" },
        ],
      },
    });

    if (!chat) {
      chat = new Chat({
        participants: [
          { user: userId, role: "user" },
          { user: providerId, role: "service-provider" },
        ],
        providerInfo: {
          email: provider.email || "Email não disponível",
          address: provider.formattedAddress || "Endereço não disponível",
        },
        messages: [],
        lastMessage: "Nenhuma mensagem ainda.",
        lastMessageAt: new Date(),
      });
      await chat.save();
    }

    // Preenche os dados dos participantes
    chat = await Chat.findById(chat._id).populate(
      "participants.user",
      "firstName lastName email avatar role"
    );

    // Identifica o outro participante (não o próprio usuário)
    const otherParticipant = chat.participants.find(
      (participant) => participant.user._id.toString() !== userId.toString()
    );

    if (!otherParticipant) {
      return res.status(400).json({ message: "Outro participante não encontrado." });
    }

    // Formata os dados para o frontend
    const formattedChat = {
      id: chat._id,
      providerName: otherParticipant.user.firstName + " " + otherParticipant.user.lastName,
      providerAvatar: otherParticipant.user.avatar || "/images/default-avatar.jpg",
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
    };

    res.status(200).json(formattedChat);
  } catch (error) {
    console.error("Erro ao iniciar chat:", error);
    res.status(500).json({ message: "Erro ao iniciar chat." });
  }
};
// Listar mensagens de um chat
const listMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verifica se o chat existe
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat não encontrado. Verifique o ID." });
    }

    // Retorna as mensagens ou vazio se não houver mensagens
    res.status(200).json(chat.messages || []);
  } catch (error) {
    console.error("Erro ao listar mensagens:", error);
    res.status(500).json({ message: "Erro interno ao listar mensagens." });
  }
};
// Listar todos os chats de um usuário
const listUserChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({ "participants.user": userId })
      .populate("participants.user", "firstName lastName avatar role")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error("Erro ao listar chats:", error);
    res.status(500).json({ message: "Erro ao listar chats." });
  }
};
// Enviar mensagem
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    // Validação: Verifique se o conteúdo da mensagem foi enviado
    if (!content) {
      return res.status(400).json({ message: "Conteúdo da mensagem é obrigatório." });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat não encontrado." });
    }

    // Criação da mensagem
    const message = {
      sender: req.user._id,
      content, // Certifique-se de que este campo é preenchido
      sentAt: new Date(),
    };

    // Adiciona a mensagem ao array e atualiza as informações do chat
    chat.messages.push(message);
    chat.lastMessage = content;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    res.status(500).json({ message: "Erro ao enviar mensagem." });
  }
};

const editMessage = async (req, res) => {
  const { chatId, messageId } = req.params;
  const { content } = req.body;

  try {
    console.log("Editando mensagem...");
    console.log("Chat ID:", chatId);
    console.log("Mensagem ID:", messageId);

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat não encontrado." });
    }

    const message = chat.messages.find((msg) => msg._id.toString() === messageId);
    if (!message) {
      return res.status(404).json({ message: "Mensagem não encontrada." });
    }

    message.content = content || message.content;
    message.editedAt = new Date();
    await chat.save();

    console.log("Mensagem editada com sucesso:", message);
    res.status(200).json(message);
  } catch (error) {
    console.error("Erro ao editar mensagem:", error);
    res.status(500).json({ message: "Erro ao editar mensagem." });
  }
};

// Deletar mensagem de um chat
const deleteMessage = async (req, res) => {
  const { chatId, messageId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat não encontrado." });
    }

    chat.messages = chat.messages.filter((msg) => msg._id.toString() !== messageId);
    await chat.save();

    res.status(200).json({ message: "Mensagem deletada com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar mensagem:", error);
    res.status(500).json({ message: "Erro ao deletar mensagem." });
  }
};

// Atualizar status das mensagens para "lidas"
const markMessagesAsRead = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat não encontrado." });
    }

    chat.messages = chat.messages.map((msg) => {
      if (!msg.readAt && msg.sender.toString() !== req.user.id) {
        msg.readAt = new Date();
      }
      return msg;
    });

    await chat.save();

    res.status(200).json({ message: "Mensagens marcadas como lidas." });
  } catch (error) {
    console.error("Erro ao marcar mensagens como lidas:", error);
    res.status(500).json({ message: "Erro ao marcar mensagens como lidas." });
  }
};

// Excluir um chat inteiro
const deleteChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat não encontrado." });
    }

    await chat.remove();
    res.status(200).json({ message: "Chat excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir chat:", error);
    res.status(500).json({ message: "Erro ao excluir chat." });
  }
};

// Buscar mensagens por palavra-chave
const searchMessages = async (req, res) => {
  const { chatId } = req.params;
  const { keyword } = req.query;

  try {
    console.log("Buscando mensagens por palavra-chave...");
    console.log("Chat ID:", chatId);
    console.log("Palavra-chave:", keyword);

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat não encontrado." });
    }

    const filteredMessages = chat.messages.filter((msg) =>
      msg.content.toLowerCase().includes(keyword.toLowerCase())
    );

    res.status(200).json(filteredMessages);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).json({ message: "Erro ao buscar mensagens." });
  }
};
// Buscar chats por palavra-chave no nome dos participantes ou conteúdo
const listChatsByKeyword = async (req, res) => {
  const { keyword } = req.query;

  try {
    const chats = await Chat.find({
      participants: req.user.id,
      $or: [
        { "participants.firstName": { $regex: keyword, $options: "i" } },
        { "messages.content": { $regex: keyword, $options: "i" } },
      ],
    })
      .populate("participants", "firstName lastName email")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error("Erro ao buscar chats por palavra-chave:", error);
    res.status(500).json({ message: "Erro ao buscar chats." });
  }
};

// Fixar um chat
const pinChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat não encontrado." });
    }

    chat.isPinned = true;
    await chat.save();

    res.status(200).json({ message: "Chat fixado com sucesso." });
  } catch (error) {
    console.error("Erro ao fixar chat:", error);
    res.status(500).json({ message: "Erro ao fixar chat." });
  }
};

// Desfixar um chat
const unpinChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat não encontrado." });
    }

    chat.isPinned = false;
    await chat.save();

    res.status(200).json({ message: "Chat desfixado com sucesso." });
  } catch (error) {
    console.error("Erro ao desfixar chat:", error);
    res.status(500).json({ message: "Erro ao desfixar chat." });
  }
};

module.exports = {
  startChat,
  listMessages,
  listUserChats,
  editMessage,
  sendMessage,
  deleteMessage,
  markMessagesAsRead,
  deleteChat,
  searchMessages,
  listChatsByKeyword,
  pinChat,
  unpinChat,
};
