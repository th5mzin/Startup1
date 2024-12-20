const Service = require("../models/Service");
const User = require("../models/User");

const validateRequest = async (req, res, next) => {
  const { serviceId, userId, startTime, endTime } = req.body;

  try {
    // Verificar se o serviço existe
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }

    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Verificar horários válidos
    const [startHour] = startTime.split(":").map(Number);
    const [endHour] = endTime.split(":").map(Number);
    const duration = endHour - startHour;

    if (duration <= 0) {
      return res.status(400).json({ message: "Horário de término inválido." });
    }

    req.service = service; // Passa o serviço para o próximo middleware
    req.user = user;       // Passa o usuário para o próximo middleware
    req.totalPrice = service.pricePerHour * duration; // Calcula o preço total

    next(); // Continua para o próximo middleware ou controlador
  } catch (error) {
    console.error("Erro na validação da requisição:", error);
    res.status(500).json({ message: "Erro interno no servidor.", error });
  }
};

module.exports = validateRequest;
