const Request = require("../models/Request");
const User = require("../models/User");
const mongoose = require("mongoose");
const axios = require("axios");
const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
// Função auxiliar para obter coordenadas
const getCoordinates = async (city, state, country) => {
  const url = `https://geocode.xyz/${encodeURIComponent(`${city}, ${state}, ${country}`)}?json=1`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "ProFix/1.0 (contato@faqprofix.com)",
      },
    });

    const data = response.data;

    if (data.latt && data.longt) {
      return {
        lat: parseFloat(data.latt),
        lng: parseFloat(data.longt),
      };
    } else {
      throw new Error("Endereço não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao obter coordenadas:", error.message);
    throw new Error("Erro ao obter coordenadas.");
  }
};

// Função auxiliar para calcular preço total
const calculateTotalPrice = (pricePerHour, totalHours) => {
  if (pricePerHour <= 0 || totalHours <= 0) {
    throw new Error("Preço por hora ou número de horas inválidos.");
  }
  return pricePerHour * totalHours;
};

// Função para lidar com erros
const handleError = (res, error, message) => {
  console.error(message, error); // Log do erro
  res.status(500).json({ message: message || "Erro interno do servidor." });
};
// Função para tratar erros
const createRequest = async (req, res) => {
  console.log("Payload recebido:", req.body); 

  const { providerId, category, pricePerHour, totalHours, address, location, schedule } = req.body;

  try {
    // Verifica campos obrigatórios
    if (!providerId || !category || !pricePerHour || !totalHours || !address || !location || !schedule) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    // Verifica solicitação pendente
    const existingRequest = await Request.findOne({ providerId, status: "pending" });
    if (existingRequest) {
      return res.status(400).json({ message: "Este prestador já tem uma solicitação pendente." });
    }

    // Busca prestador e cliente
    const provider = await User.findById(providerId);
if (!provider) {
  return res.status(404).json({ message: "Prestador não encontrado." });
}

const client = await User.findById(req.user._id);
if (!client) {
  return res.status(404).json({ message: "Cliente não encontrado." });
}


    // Criação da solicitação
    const newRequest = new Request({
      client: req.user._id,
      providerId: providerId,
      category,
      pricePerHour,
      totalHours,
      totalPrice: calculateTotalPrice(pricePerHour, totalHours),
      address,
      location,
      schedule,
      status: "pending",
      providerFirstName: provider.firstName,
      providerLastName: provider.lastName,
      providerEmail: provider.email,
      clientFirstName: client.firstName,
      clientLastName: client.lastName,
      clientEmail: client.email
    });

    // Salva a solicitação
    await newRequest.save();

    // Responde com a solicitação criada
    res.status(201).json(newRequest);
  } catch (error) {
    console.error("Erro ao criar solicitação:", error);
    res.status(500).json({ message: "Erro ao criar solicitação." });
  }
};
const respondToRequest = async (req, res) => {
  const { action, requestId, priceProposed } = req.body; // Desestruturação dos dados recebidos do corpo da requisição

  try {
    // Log para verificar os valores recebidos
    console.log('Ação:', action);
    console.log('ID da solicitação:', requestId);
    console.log('Preço proposto:', priceProposed);

    // Verifica se o ID da solicitação é válido
    if (!validateObjectId(requestId)) {
      return res.status(400).json({ message: "ID de solicitação inválido." });
    }

    // Busca a solicitação no banco de dados
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Solicitação não encontrada." });
    }

    // Verifica o tipo de ação (aceitar ou rejeitar)
    if (action === "accept") {
      // Aceitar a solicitação
      request.status = "accepted";  // Marca o status como "aceito"
      request.selectedProvider = req.user.id;  // Atribui o prestador à solicitação
      request.providerFirstName = req.user.firstName;  // Adiciona o nome do prestador
      request.providerLastName = req.user.lastName;    // Adiciona o sobrenome do prestador
      request.providerEmail = req.user.email;          // Adiciona o email do prestador
      request.acceptedAt = new Date();  // Marca a data e hora da aceitação

      // Calcula o 'endTime' baseado no 'startTime' e 'totalHours'
      const startTime = new Date(request.schedule.startTime);  // Converte o startTime para um objeto Date
      const totalHours = request.totalHours;  // Total de horas para o serviço

      // Valida o total de horas
      if (!totalHours || isNaN(totalHours) || totalHours <= 0) {
        return res.status(400).json({ message: "Total de horas inválido." });
      }

      // Calcula o 'endTime' somando as 'totalHours' ao 'startTime'
      const endTime = new Date(startTime.getTime() + totalHours * 60 * 60 * 1000);  // totalHours * 60 * 60 * 1000 (para converter horas para milissegundos)
      request.schedule.endTime = endTime;  // Define o 'endTime' na solicitação

      // Se um preço foi proposto, adiciona à solicitação
      if (priceProposed && priceProposed > 0) {
        request.totalPrice = priceProposed * totalHours; // Calcula o total com base no preço proposto
      }

      // Adiciona a resposta do prestador
      request.responses.push({
        provider: req.user.id,
        message: "Solicitação aceita",
        priceProposed: priceProposed || request.pricePerHour, // Usa o preço proposto ou o preço padrão
        responseTime: new Date(),
      });

      // Salva as alterações na solicitação
      await request.save();

      // Responde com sucesso
      return res.status(200).json({
        message: "Solicitação aceita com sucesso.",
        request,  // Retorna a solicitação com os dados atualizados
      });

    } else if (action === "reject") {
      // Rejeitar a solicitação
      request.status = "rejected";  // Marca o status como "rejeitado"

      // Adiciona a resposta do prestador com motivo
      request.responses.push({
        provider: req.user.id,
        message: "Solicitação rejeitada",
        responseTime: new Date(),
      });

      await request.save();

      // Retorna a resposta com sucesso
      return res.status(200).json({
        message: "Solicitação rejeitada com sucesso.",
        request,  // Retorna a solicitação com o status "rejeitado"
      });

    } else {
      // Se a ação não for válida, retorna erro 400
      return res.status(400).json({ message: "Ação inválida." });
    }
  } catch (error) {
    // Trata erros de execução
    console.error('Erro ao processar solicitação:', error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};

// Buscar mensagens de uma solicitação
const getMessages = async (req, res) => {
  const { requestId } = req.params;

  try {
    if (!validateObjectId(requestId)) {
      return res.status(400).json({ message: "ID de solicitação inválido." });
    }

    const request = await Request.findById(requestId).populate("messages.from", "firstName lastName email");
    if (!request) {
      return res.status(404).json({ message: "Solicitação não encontrada." });
    }

    res.status(200).json({ messages: request.messages });
  } catch (error) {
    handleError(res, error, "Erro ao buscar mensagens.");
  }
};

// Enviar mensagem em uma solicitação confirmada
const sendMessage = async (req, res) => {
  const { requestId } = req.params;
  const { content } = req.body;

  try {
    if (!validateObjectId(requestId)) {
      return res.status(400).json({ message: "ID de solicitação inválido." });
    }

    if (!content || content.length > 500) {
      return res.status(400).json({ message: "Conteúdo da mensagem é obrigatório e deve ter no máximo 500 caracteres." });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Solicitação não encontrada." });
    }

    request.messages.push({
      from: req.user.id,
      content,
      sentAt: new Date(),
    });

    await request.save();
    res.status(200).json({ message: "Mensagem enviada com sucesso.", messages: request.messages });
  } catch (error) {
    handleError(res, error, "Erro ao enviar mensagem.");
  }
};

// Selecionar prestador
const selectProvider = async (req, res) => {
  const { requestId } = req.params;

  try {
    if (!validateObjectId(requestId)) {
      return res.status(400).json({ message: "ID de solicitação inválido." });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Solicitação não encontrada." });
    }

    if (request.client.toString() !== req.user.id) {
      return res.status(403).json({ message: "Acesso negado. Você não é o cliente desta solicitação." });
    }

    if (!request.provider) {
      return res.status(400).json({ message: "Nenhum prestador foi associado a esta solicitação." });
    }

    request.status = "confirmed";
    await request.save();

    res.status(200).json({ message: "Prestador selecionado com sucesso.", request });
  } catch (error) {
    handleError(res, error, "Erro ao selecionar prestador.");
  }
};

// Cancelar solicitação
const cancelRequest = async (req, res) => {
  const { requestId, userId } = req.body;

  try {
    if (!validateObjectId(requestId) || !validateObjectId(userId)) {
      return res.status(400).json({ message: "IDs inválidos." });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Solicitação não encontrada." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Somente solicitações pendentes podem ser canceladas." });
    }

    if (request.client.toString() !== userId && request.provider.toString() !== userId) {
      return res.status(403).json({ message: "Você não tem permissão para cancelar esta solicitação." });
    }

    request.status = "canceled";
    await request.save();

    res.status(200).json({ message: "Solicitação cancelada com sucesso.", request });
  } catch (error) {
    handleError(res, error, "Erro ao cancelar solicitação.");
  }
};

// Liberar pagamento
const releasePayment = async (req, res) => {
  const { requestId } = req.params;

  try {
    if (!validateObjectId(requestId)) {
      return res.status(400).json({ message: "ID de solicitação inválido." });
    }

    const request = await Request.findById(requestId);
    if (!request || request.status !== "completed") {
      return res.status(400).json({ message: "Pagamento não pode ser liberado." });
    }

    const provider = await User.findById(request.provider);
    if (!provider) {
      return res.status(404).json({ message: "Prestador não encontrado." });
    }

    provider.balance += request.totalPrice;
    await provider.save();

    res.status(200).json({ message: "Pagamento liberado com sucesso." });
  } catch (error) {
    handleError(res, error, "Erro ao liberar pagamento.");
  }
};

// Criar disputa
const createDispute = async (req, res) => {
  const { requestId, reason, userId } = req.body;

  try {
    if (!validateObjectId(requestId) || !validateObjectId(userId)) {
      return res.status(400).json({ message: "IDs inválidos." });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Solicitação não encontrada." });
    }

    if (request.status !== "confirmed") {
      return res.status(400).json({ message: "Apenas solicitações confirmadas podem entrar em disputa." });
    }

    request.status = "disputed";
    request.dispute = {
      isDisputed: true,
      reason,
      by: userId,
      status: "open", // Status inicial da disputa
    };

    await request.save();
    res.status(200).json({ message: "Disputa iniciada com sucesso.", request });
  } catch (error) {
    handleError(res, error, "Erro ao iniciar disputa.");
  }
};

// Atualizar localizações para GeoJSON
const updateLocationsToGeoJSON = async (req, res) => {
  try {
    const providers = await User.find({ role: "service-provider", location: { $exists: true } });

    for (const provider of providers) {
      if (provider.location.lat && provider.location.lng) {
        provider.location = {
          type: "Point",
          coordinates: [provider.location.lng, provider.location.lat],
        };
        await provider.save();
      }
    }

    res.status(200).json({ message: "Localizações atualizadas com sucesso." });
  } catch (error) {
    handleError(res, error, "Erro ao atualizar localizações.");
  }
};
const getPendingRequests = async (req, res) => {
  try {
    const requests = await Request.find({ status: "pending" });
    res.status(200).json({ requests });
  } catch (error) {
    handleError(res, error, "Erro ao buscar solicitações pendentes.");
  }
};

// Buscar solicitações de um usuário
const getRequestsByUser = async (req, res) => {
  const { userId } = req.params; // Obtém o userId dos parâmetros da URL

  try {
    // Verifica se o parâmetro userId está presente
    if (!userId) {
      return res.status(400).json({ message: "Usuário não fornecido." });
    }

    // Consulta no banco de dados para buscar as solicitações do usuário (client)
    const requests = await Request.find({ client: userId })
      .populate('client', 'firstName lastName email') // Popula o campo client com os dados do cliente
      .populate('providerId', 'firstName lastName email'); // Popula o campo providerId com os dados do prestador de serviço

    // Verifica se o usuário tem solicitações
    if (!requests || requests.length === 0) {
      return res.status(404).json({ message: "Nenhuma solicitação encontrada para este usuário." });
    }

    // Retorna as solicitações encontradas
    res.status(200).json(requests);
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error);
    res.status(500).json({ message: "Erro ao buscar solicitações." });
  }
};
// Método para buscar provedores
const getProviders = async (req, res) => {
  const { category, city, state, country } = req.query;

  try {
    // Validação dos parâmetros obrigatórios
    if (!city || !state || !country) {
      return res.status(400).json({
        message: "Os parâmetros city, state e country são obrigatórios.",
      });
    }

    // Normaliza as strings para busca
    const normalizeString = (str) =>
      str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

    const normalizedCity = normalizeString(city);
    const normalizedState = normalizeString(state);
    const normalizedCountry = normalizeString(country);

    // Obter coordenadas da localização
    const { lat, lng } = await getCoordinates(normalizedCity, normalizedState, normalizedCountry);

    // Validação das coordenadas
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Coordenadas inválidas ou não encontradas." });
    }

    // Define um raio fixo de 10 km
    const radiusInMeters = 10 * 1000; // 10 km em metros

    // Montar a query
    const query = {
      role: "service-provider",
      ...(category && category !== "all" && { category }),
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInMeters / 6378100], // 6378100 = Raio médio da Terra em metros
        },
      },
    };

    console.log("Query gerada:", query);

    // Buscar provedores
    const providers = await User.find(query).select(
      "firstName lastName category email pricePerHour location ratingStats avatar isBusy address"
    );

    if (!providers.length) {
      return res.status(404).json({ message: "Nenhum provedor encontrado." });
    }

    // Formatar resposta para incluir endereço e avaliações
    const formattedProviders = providers.map((provider) => ({
      providerId: provider._id,
      firstName: provider.firstName,
      lastName: provider.lastName,
      category: provider.category,
      pricePerHour: provider.pricePerHour,
      avatar: provider.avatar,
      isBusy: provider.isBusy,
      ratingStats: provider.ratingStats,
      formattedAddress: `${provider.address?.city || "Cidade não definida"}-${provider.address?.state || "Estado não definido"}, ${provider.address?.country || "País não definido"}`,
    }));

    res.status(200).json({ providers: formattedProviders });
  } catch (error) {
    console.error("Erro ao buscar provedores:", error.message);
    res.status(500).json({ message: "Erro ao buscar provedores." });
  }
};
const getRequestsByProvider = async (req, res) => {
  const { providerId } = req.params;

  try {
    if (!validateObjectId(providerId)) {
      return res.status(400).json({ message: "ID de prestador inválido." });
    }

    console.log("Buscando solicitações para providerId:", providerId);

    const requests = await Request.find({ providerId }).populate('client', 'firstName lastName email');

    console.log("Solicitações encontradas:", requests);

    if (requests.length === 0) {
      console.log("Nenhuma solicitação encontrada para este providerId.");
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error);
    res.status(500).json({ message: "Erro ao buscar solicitações." });
  }
};
const processPayment = async (req, res) => {
  const { paymentMethod, amount, requestId, cardDetails } = req.body;

  try {
    // Verifica os dados obrigatórios
    if (!requestId || !amount || !paymentMethod) {
      return res.status(400).json({ message: "Dados obrigatórios faltando." });
    }

    // Busca a solicitação
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Solicitação não encontrada." });
    }

    let paymentIntent;

    if (paymentMethod === "pix") {
      // Processa o pagamento via Pix
      paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Valor em centavos
        currency: "brl",
        payment_method_types: ["pix"],
        metadata: { requestId },
      });

      // Atualiza a solicitação com os detalhes do Pix
      request.paymentIntentId = paymentIntent.id;
      request.paymentMethod = "pix";
      await request.save();

      return res.status(200).json({
        message: "Pagamento PIX iniciado.",
        pixDetails: paymentIntent.next_action?.pix_display_qr_code,
        paymentIntentId: paymentIntent.id,
      });
    } else if (paymentMethod === "credit_card") {
      // Verifica os detalhes do cartão
      if (!cardDetails || !cardDetails.paymentMethodId) {
        return res.status(400).json({ message: "Detalhes do cartão inválidos." });
      }

      // Processa o pagamento via cartão
      paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "brl",
        payment_method: cardDetails.paymentMethodId,
        confirm: true, // Confirma automaticamente o pagamento
        metadata: { requestId },
      });

      // Atualiza a solicitação com os detalhes do pagamento
      request.paymentIntentId = paymentIntent.id;
      request.paymentMethod = "credit_card";
      request.status = "paid";
      await request.save();

      return res.status(200).json({
        message: "Pagamento com cartão processado com sucesso.",
        paymentIntent,
      });
    } else {
      // Método de pagamento inválido
      return res.status(400).json({ message: "Método de pagamento inválido." });
    }
  } catch (error) {
    console.error("Erro ao processar pagamento:", error.message);
    res.status(500).json({ message: "Erro ao processar pagamento.", error: error.message });
  }
};
const completeRequest = async (req, res) => {
  const { requestId, stars } = req.body;

  try {
    // Validações iniciais
    if (!validateObjectId(requestId)) {
      return res.status(400).json({ message: "ID de solicitação inválido." });
    }
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Avaliação inválida. Escolha um valor entre 1 e 5 estrelas." });
    }

    // Busca a solicitação
    const request = await Request.findById(requestId).populate("selectedProvider");
    if (!request) {
      return res.status(404).json({ message: "Solicitação não encontrada." });
    }
    if (request.status !== "accepted") {
      return res.status(400).json({ message: "Somente solicitações aceitas podem ser concluídas." });
    }

    const currentTime = new Date();
    if (currentTime < new Date(request.schedule.endTime)) {
      return res.status(400).json({ message: "O horário de término ainda não foi atingido." });
    }

    // Atualiza a solicitação e o prestador
    request.status = "completed";
    request.paymentCompletedAt = currentTime;

    const provider = request.selectedProvider;
    if (!provider) {
      return res.status(404).json({ message: "Prestador não encontrado." });
    }

    // Atualiza a avaliação do prestador
    const totalRatings = provider.ratingStats.totalRatings || 0;
    const currentAverage = provider.ratingStats.averageRating || 0;
    provider.ratingStats.averageRating =
      ((currentAverage * totalRatings) + stars) / (totalRatings + 1);
    provider.ratingStats.totalRatings += 1;

    // Lógica de liberação de saldo
    const daysToWait = provider.isVerified ? 1 : 3;
    const releaseDate = new Date(currentTime);
    releaseDate.setDate(releaseDate.getDate() + daysToWait);
     // Garante que o saldo seja atualizado corretamente
     provider.pendingBalance = (provider.pendingBalance || 0) + request.totalPrice;

    // Salva as atualizações
    await request.save();
    await provider.save();

    res.status(200).json({ message: "Solicitação concluída com sucesso.", request });
  } catch (error) {
    handleError(res, error, "Erro ao concluir solicitação.");
  }
};
const processWithdrawal = async (req, res) => {
  const { amount, transferMethod, accountDetails } = req.body;

  try {
    const provider = await User.findById(req.user.id);

    if (!provider || provider.role !== "service-provider") {
      return res.status(403).json({ message: "Apenas prestadores podem realizar saques." });
    }

    if (provider.availableBalance < amount) {
      return res.status(400).json({ message: "Saldo insuficiente para saque." });
    }

    let transfer;
    if (transferMethod === "pix") {
      // Transferência PIX
      transfer = await stripe.transfers.create({
        amount: amount * 100,
        currency: "brl",
        metadata: { providerId: provider.id },
        destination: accountDetails.pixKey,
      });
    } else if (transferMethod === "bank_transfer") {
      // Transferência bancária
      transfer = await stripe.transfers.create({
        amount: amount * 100,
        currency: "brl",
        metadata: { providerId: provider.id },
        destination: accountDetails.bankAccountId,
      });
    } else {
      return res.status(400).json({ message: "Método de saque inválido." });
    }

    provider.availableBalance -= amount;
    await provider.save();

    res.status(200).json({
      message: "Saque realizado com sucesso.",
      transferDetails: transfer,
      newAvailableBalance: provider.availableBalance,
    });
  } catch (error) {
    console.error("Erro ao processar saque:", error.message);
    res.status(500).json({ message: "Erro ao realizar saque.", error: error.message });
  }
};
const deleteRequest = async (req, res) => {
  console.log("Tentativa de deletar solicitação...");
  console.log("Parâmetros recebidos:", req.params);

  const { requestId } = req.params;

  if (!requestId) {
    console.error("ID de solicitação ausente.");
    return res.status(400).json({ message: "ID de solicitação ausente." });
  }

  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    console.error("ID de solicitação inválido:", requestId);
    return res.status(400).json({ message: "ID de solicitação inválido." });
  }

  try {
    const request = await Request.findById(requestId);
    if (!request) {
      console.error("Solicitação não encontrada para o ID:", requestId);
      return res.status(404).json({ message: "Solicitação não encontrada." });
    }

    await Request.findByIdAndDelete(requestId);
    console.log("Solicitação removida com sucesso:", requestId);
    res.status(200).json({ message: "Solicitação removida com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir solicitação:", error);
    res.status(500).json({ message: "Erro ao excluir solicitação." });
  }
};
module.exports = {
  createRequest,
  processPayment, // Nova função
  processWithdrawal,
  deleteRequest,
  getPendingRequests,
  getRequestsByProvider,
  respondToRequest,
  selectProvider,
  sendMessage,
  getMessages,
  completeRequest,
  cancelRequest,
  createDispute,
  updateLocationsToGeoJSON,
  getRequestsByUser ,
  getProviders,
  releasePayment,

};