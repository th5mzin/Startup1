/**
 * AuthController.js
 */
const User = require('../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Função para gerar tokens JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Registrar usuário
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, role, country, state, city, cpf } = req.body;

  console.log('Tentando registrar usuário:', req.body);

  // Validação de erros
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Verificar se o email já está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registrado.' });
    }

    // Criar novo usuário
    const newUser = new User({
      firstName,
      lastName,
      email,
      password, // Será hashada pelo middleware pre('save')
      role,
      country,
      state,
      city,
      cpf,
    });

    // Salvar usuário no banco de dados
    await newUser.save();
    console.log('Usuário registrado com sucesso:', newUser);

    // Gerar token JWT
    const token = generateToken(newUser._id);

    return res.status(201).json({
      message: 'Usuário registrado com sucesso.',
      token,
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ message: 'Erro no servidor. Tente novamente.' });
  }
};

// Login do usuário
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  console.log('Tentando login com:', req.body);

  // Validação de erros
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Buscar usuário pelo email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(400).json({ message: 'Usuário não encontrado.' });
    }

    console.log('Usuário encontrado:', user);

    // Comparar senha fornecida com o hash armazenado
    const isMatch = await argon2.verify(user.password, password);
    console.log('Resultado da comparação de senha:', isMatch);

    if (!isMatch) {
      console.log('Senha incorreta.');
      return res.status(400).json({ message: 'Senha incorreta.' });
    }

    // Gerar token JWT
    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ message: 'Erro no servidor. Tente novamente.' });
  }
};

// Verificar token JWT
const verifyToken = async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password'); // Não retornar senha

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
};
