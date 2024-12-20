const User = require('../models/User');
const Request = require('../models/Request');
const { validationResult } = require('express-validator');
const argon2 = require('argon2');

// Obter informações do usuário pelo ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ message: 'Erro ao obter usuário.', error });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Usuário deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro ao deletar usuário.' });
  }
};
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    let requests = [];

    if (user.role === 'user') {
      // Para clientes, incluir solicitações feitas
      requests = await Request.find({ user: req.user.id })
        .populate('selectedProvider', 'firstName lastName category pricePerHour') // Nome e dados do prestador
        .select('-messages'); // Excluindo mensagens
    } else if (user.role === 'service-provider') {
      // Para prestadores, incluir solicitações relacionadas
      requests = await Request.find({ selectedProvider: req.user.id })
        .populate('user', 'firstName lastName') // Nome do cliente
        .select('-messages'); // Excluindo mensagens
    }

    // Retorna os dados do usuário, incluindo `ratingStats` e `completedRequests` diretamente do banco
    res.status(200).json({
      user: {
        _id: user._id,
        avatar: user.avatar,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        country: user.country,
        city: user.city,
        state: user.state,
        cpf: user.cpf,
        isActive: user.isActive,
        isVerified: user.isVerified,
        balance: user.balance,
        providerId: user.providerId,
        category: user.category,
        pricePerHour: user.pricePerHour,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        ratingStats: user.ratingStats || { averageRating: 0, totalRatings: 0 }, // Usa valores padrão se `ratingStats` não existir
        completedRequests: user.completedRequests || 0, // Usa valor padrão se `completedRequests` não existir
      },
      requests: requests || [], // Retorna as solicitações
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil.', error });
  }
};
// Atualizar informações do usuário
const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Permitir atualizações controladas
    const allowedUpdates = ['pricePerHour', 'category', 'location', 'avatar'];
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        user[key] = req.body[key];
      }
    });

    await user.save();
    res.status(200).json({ message: 'Usuário atualizado com sucesso.', user });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário.', error });
  }
};

// Listar todas as solicitações de um usuário
const listRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user.id })
      .populate('selectedProvider', 'firstName lastName category pricePerHour')
      .select('-messages');
    res.status(200).json(requests);
  } catch (error) {
    console.error('Erro ao listar solicitações:', error);
    res.status(500).json({ message: 'Erro ao listar solicitações.', error });
  }
};

// Obter histórico de mensagens de uma solicitação confirmada
const listMessages = async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await Request.findById(requestId).select('messages').populate('messages.from', 'firstName lastName');

    if (!request) {
      return res.status(404).json({ message: 'Solicitação não encontrada.' });
    }

    if (request.user.toString() !== req.user.id && request.selectedProvider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Acesso negado às mensagens desta solicitação.' });
    }

    res.status(200).json(request.messages);
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({ message: 'Erro ao listar mensagens.', error });
  }
};

// Alterar a senha do usuário
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const isMatch = await argon2.verify(user.password, currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha atual incorreta.' });
    }

    user.password = await argon2.hash(newPassword);
    await user.save();

    res.status(200).json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha.', error });
  }
};

// Obter todos os usuários (somente para administradores)
const getAllUsers = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Erro ao obter todos os usuários:', error);
    res.status(500).json({ message: 'Erro ao obter todos os usuários.', error });
  }
};

module.exports = {
  getUserById,
  getProfile,
  updateUser,
  listRequests,
  listMessages,
  deleteUser,
  changePassword,
  getAllUsers,
};
