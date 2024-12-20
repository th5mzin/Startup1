/**
 * AuthController.js
 */
const User = require('../models/User');
const argon2 = require('argon2');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { generateUniqueProviderId } = require('../models/User');
// Função para gerar tokens JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
const getCoordinates = async (address) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    address
  )}&format=json&limit=1`;
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "YourAppName/1.0",
    },
  });

  const data = response.data;

  if (data.length === 0) {
    throw new Error("Não foi possível localizar o endereço.");
  }

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
};
/// Registrar usuário
const registerUser  = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    cpf,
    category,
    pricePerHour,
    address, // Inclui o objeto de endereço completo no corpo da requisição
  } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Verifica se o email já foi registrado
    const existingUser  = await User.findOne({ email });
    if (existingUser ) {
      return res.status(400).json({ message: "Email já registrado." });
    }

    // Validações específicas para prestadores de serviço
    if (role === "service-provider") {
      if (!category || !pricePerHour) {
        return res.status(400).json({
          message: "Categoria e preço por hora são obrigatórios para prestadores de serviço.",
        });
      }
      if (pricePerHour <= 0) {
        return res.status(400).json({
          message: "O preço por hora deve ser maior que zero.",
        });
      }
    }

    // Obter coordenadas do endereço
    let coordinates;
    try {
      coordinates = await getCoordinates(`${address.street}, ${address.city}, ${address.state}, ${address.country}`);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Cria um novo usuário com base nos dados fornecidos
    const newUser  = new User({
      firstName,
      lastName,
      email,
      password,
      role: role || "user",
      cpf,
      category: role === "service-provider" ? category : undefined,
      pricePerHour: role === "service-provider" ? parseFloat(pricePerHour) : undefined,
      address: {
        zipCode: address.zipCode.trim(),
        street: address.street.trim(),
        houseNumber: address.houseNumber.trim(),
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        country: address.country.trim(),
      },
      balance: 0,
      providerId: role === "service-provider" ? new mongoose.Types.ObjectId() : undefined,
      location: {
        type: "Point",
        coordinates: [coordinates.longitude, coordinates.latitude], // Salva as coordenadas
      },
    });

    // Salva o novo usuário no banco de dados
    await newUser .save();

    // Gera um token de autenticação
    const token = generateToken(newUser ._id);

    // Retorna o sucesso da operação
    return res.status(201).json({
      message: "Usuário registrado com sucesso.",
      token,
      user: {
        id: newUser ._id,
        firstName: newUser .firstName,
        lastName: newUser .lastName,
        email: newUser .email,
        role: newUser .role,
        address: newUser .address,
        location: newUser .location, // Inclui a localização na resposta
      },
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);

    // Trata erros específicos do MongoDB (como duplicidade)
    if (error.code === 11000) {
      return res.status(400).json({ message: "Dados duplicados. Verifique suas informações." });
    }

    // Trata erros genéricos
    return res.status(500).json({ message: "Erro no servidor. Tente novamente." });
  }
};
// Login do usuário
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado.' });
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Senha incorreta.' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        category: user.category,
        pricePerHour: user.pricePerHour,
        location: user.location,
        address: user.address,
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
    const user = await User.findById(decoded.id).select('-password');

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
