const User = require('../models/User');  // Supondo que você tenha um modelo de usuário
const { check, validationResult } = require('express-validator'); // Para validação

// Função para pegar um usuário por ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter o usuário', error });
  }
};

// Função para listar requisições
const listRequests = async (req, res) => {
  try {
    const requests = await Request.find({ userId: req.user.id }).populate('serviceId');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar requisições.', error });
  }
};

// Função para listar mensagens do usuário
const listMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    }).populate('senderId receiverId');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao listar mensagens.', error });
  }
};

// Função para atualizar um usuário
const updateUser  = async (req, res) => {
  // Validação dos dados
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar o usuário', error });
  }
};

// Função para deletar um usuário
const deleteUser  = async (req, res) => {
  // Verifique se o usuário tem permissão para deletar
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar o usuário', error });
  }
};

// Função para obter todos os usuários (administrador ou função similar)
const getAllUsers = async (req, res) => {
  // Verifique se o usuário tem permissão para ver todos os usuários
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter todos os usuários', error });
  }
};

// Função para pegar o perfil do usuário logado
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    // Obter serviços do usuário
    const services = await Service.find({ provider: user._id });

    res.status(200).json({ user, services });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar perfil.' });
  }
};

// Função para alterar a senha do usuário
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validação dos dados
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verifique se a senha atual está correta (supondo que você tenha um método para isso)
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    // Atualize a senha
    user.password = newPassword; // Certifique-se de que a nova senha seja criptografada
    await user.save();

    res.status(200).json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao alterar a senha', error });
  }
};

// Exporte todas as funções para o router
module.exports = {
  getUserById,
  updateUser ,
  deleteUser ,
  listRequests,
  listMessages,
  getAllUsers,
  getProfile,
  changePassword
};