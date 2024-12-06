const User = require('../models/User'); // Modelo de Usuário
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Função para criar um novo usuário
const registerUser  = async (req, res) => {
  const { email, password, firstName, lastName, country, city, state, cpf, role } = req.body;

  try {
    // Verificar se o usuário já existe
    const existingUser  = await User.findOne({ email });
    if (existingUser ) {
      return res.status(400).json({ message: 'Usuário já existe.' });
    }

    // Validar o CPF se o usuário for do Brasil
    if (country === 'Brazil' && !cpf) {
      return res.status(400).json({ message: 'CPF é obrigatório para usuários do Brasil.' });
    }
    const userRole = role || 'user';

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o novo usuário
    const newUser  = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      country,
      city,
      role: userRole,
      state,
      cpf: country === 'Brazil' ? cpf : undefined, // Definir CPF se o país for Brasil
    });

    // Salvar o usuário no banco de dados
    await newUser .save();

    // Gerar o token JWT para autenticação
    const token = jwt.sign({ id: newUser ._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Resposta de sucesso
    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      user: {
        email: newUser .email,
        firstName: newUser .firstName,
        lastName: newUser .lastName,
        country: newUser .country,
        city: newUser .city,
        state: newUser .state,
        role: newUser .role,
        cpf: newUser .cpf,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao registrar o usuário.' });
  }
};

// Função para fazer login
const loginUser  = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado.' });
    }

    // Verificar se a senha está correta
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha incorreta.' });
    }

    // Gerar o token JWT para autenticação
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Resposta de sucesso
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        city: user.city,
        state: user.state,
        cpf: user.cpf, // Enviar o CPF, caso o usuário seja do Brasil
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
};

module.exports = {
  registerUser ,
  loginUser ,
};