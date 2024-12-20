// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const { 
  createService, 
  listServices, 
  getServiceById, 
  getServicesByStatus, 
  updateService, 
  deleteService, 
  getServicesByProvider 
} = require('../controllers/ServiceController'); // Desestruturando as funções
const authMiddleware = require('../middleware/authMiddleware');
// Criar um novo serviço
router.post('/create', authMiddleware, createService);

// Listar todos os serviços
router.get('/list', listServices);

// Buscar serviço por ID
router.get('/:id',authMiddleware, getServiceById);
router.get('/status/:status',authMiddleware, getServicesByStatus);

// Atualizar serviço
router.put('/:id', updateService);

// Excluir serviço (após 15 dias, o serviço será excluído automaticamente)
router.delete('/:id', deleteService);
router.get('/provider/:providerId', authMiddleware, getServicesByProvider);

module.exports = router;