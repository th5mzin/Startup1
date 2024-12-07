const User = require('../models/User'); // Modelo de Usuário
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator'); // Para validação de dados

// Função para gerar token JWT
const generateToken = (userId) => {
  console.log('Gerando token para o usuário:', userId);
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Função para lidar com erros
const handleError = (res, message, statusCode = 500) => {
  console.error(`[Erro ${statusCode}]:`, message); // Log detalhado para o servidor
  return res.status(statusCode).json({ message: 'Ocorreu um erro. Tente novamente.' }); // Mensagem genérica para o cliente
};

// Middleware para validação de registro
const validateUser = [
  body('email').isEmail().withMessage('Email inválido.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('A senha deve ter pelo menos 8 caracteres.')
    .matches(/[0-9]/)
    .withMessage('A senha deve conter pelo menos um número.')
    .matches(/[a-z]/)
    .withMessage('A senha deve conter pelo menos uma letra minúscula.')
    .matches(/[A-Z]/)
    .withMessage('A senha deve conter pelo menos uma letra maiúscula.')
    .matches(/[\W_]/)
    .withMessage('A senha deve conter pelo menos um caractere especial.'),
  body('firstName').notEmpty().withMessage('O primeiro nome é obrigatório.'),
  body('lastName').notEmpty().withMessage('O sobrenome é obrigatório.'),
  body('country').notEmpty().withMessage('O país é obrigatório.'),
  body('city').notEmpty().withMessage('A cidade é obrigatória.'),
  body('state').notEmpty().withMessage('O estado é obrigatório.'),
  body('cpf')
    .optional()
    .isLength({ min: 11, max: 11 })
    .withMessage('Se fornecido, o CPF deve ter 11 dígitos.'),
];

// Middleware para validação de login
const validateLogin = [
  body('email').isEmail().withMessage('Email inválido.'),
  body('password').notEmpty().withMessage('A senha é obrigatória.'),
];

// Função para registrar um novo usuário
const registerUser = async (req, res) => {
  console.log('Dados recebidos no registro:', req.body);
  const {
    email,
    password,
    firstName,
    lastName,
    country,
    city,
    state,
    cpf,
    role,
  } = req.body;

  // Validação de dados
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Erros de validação no registro:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Usuário já existe:', email);
      return res.status(400).json({ message: 'Usuário já existe.' });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hash da senha gerado:', hashedPassword);

    // Criar o novo usuário
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      country,
      city,
      state,
      role: role || 'user',
      cpf: cpf || undefined,
    });

    // Salvar o usuário no banco de dados
    await newUser.save();
    console.log('Usuário salvo no banco:', newUser);

    // Gerar o token JWT
    const token = generateToken(newUser._id);

    // Resposta de sucesso
    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      token,
      user: {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (err) {
    handleError(res, `Erro ao registrar o usuário: ${err.message}`, 500);
  }
};

// Função para fazer login
const loginUser = async (req, res) => {
  console.log('Dados recebidos no login:', req.body);
  const { email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Erros de validação no login:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(400).json({ message: 'Usuário não encontrado.' });
    }

    console.log('Usuário encontrado:', user);

    // Comparar a senha com o hash
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Resultado da comparação:', isMatch);

    if (!isMatch) {
      console.log('Senha incorreta.');
      return res.status(400).json({ message: 'Senha incorreta.' });
    }

    // Gerar o token JWT
    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    handleError(res, `Erro ao fazer login: ${err.message}`, 500);
  }
};

// Exportando as funções e os middlewares de validação
module.exports = {
  registerUser,
  loginUser,
  validateUser,
  validateLogin,
};
