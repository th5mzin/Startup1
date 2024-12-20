const express = require("express");
const router = express.Router();
const {
  createRequest,
  processPayment,
  completeRequest,
  processWithdrawal,
  getRequestsByUser,
  getProviders,
  getRequestsByProvider,
  respondToRequest,
  deleteRequest,
  updateLocationsToGeoJSON,
  cancelRequest,
  createDispute,
  getPendingRequests,
} = require("../controllers/RequestController");
const authMiddleware = require('../middleware/authMiddleware');

// Rotas de criação e listagem de solicitações
router.post("/create", authMiddleware, createRequest); // Criação de solicitações
// Obter solicitações de um usuário específico (cliente)
router.get("/by-user/:userId", authMiddleware, getRequestsByUser);
router.delete("/:requestId/delete", deleteRequest);

// Atualizar as localizações dos provedores para GeoJSON (admin/dev)
router.put("/update-locations", authMiddleware, updateLocationsToGeoJSON);
router.get("/provider/:providerId", authMiddleware, getRequestsByProvider); // Buscar solicitações por prestador

// Pagamentos e saques
router.post("/payment", authMiddleware, processPayment); // Processar pagamentos (PIX ou cartão)
router.post("/withdraw", authMiddleware, processWithdrawal); // Realizar saque
// Responder a uma solicitação (aceitar ou rejeitar)
router.post("/:requestId/respond", authMiddleware, respondToRequest);
// Obter todas as solicitações de um provedor específico
router.get("/provider/:providerId", authMiddleware, getRequestsByProvider);
// Cancelar uma solicitação
router.post("/:requestId/cancel", authMiddleware, cancelRequest);
// Criar uma disputa para a solicitação
router.post("/:requestId/dispute", authMiddleware, createDispute);
// Disputas
router.post("/dispute", authMiddleware, createDispute); // Criar disputa em uma solicitação
// Concluir a solicitação e registrar avaliação
router.post("/:requestId/complete", authMiddleware, completeRequest);
//Get Providers
router.get("/providers", getProviders);

// Listagem de solicitações pendentes
router.get("/pending", authMiddleware, getPendingRequests); // Buscar solicitações pendentes

module.exports = router;
