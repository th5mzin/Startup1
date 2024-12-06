const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/ServiceController'); // Supondo que o controller já esteja configurado

// Criar um novo serviço
router.post('/create', serviceController.createService);

// Listar todos os serviços
router.get('/list', serviceController.listServices);

// Buscar serviço por ID
router.get('/:id', serviceController.getServiceById);
router.get('/status/:status', serviceController.getServicesByStatus);

// Atualizar serviço
router.put('/:id', serviceController.updateService);

// Excluir serviço (após 15 dias, o serviço será excluído automaticamente)
router.delete('/:id', serviceController.deleteService);
router.get('/provider/:providerId', serviceController.getServicesByProvider);


module.exports = router;
