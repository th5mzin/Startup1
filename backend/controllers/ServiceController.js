const Service = require('../models/Service');
const User = require('../models/User');  // Referência ao modelo de usuário

// Função para calcular a duração total do serviço em horas
function calculateServiceDuration(days) {
  const hoursPerDay = 8;
  return days * hoursPerDay;  // Máximo de 240 horas (30 dias * 8 horas por dia)
}

const createService = async (req, res) => {
    const { providerId, pricePerHour, images, category, location, serviceDurationDays, startDate } = req.body;
  
    try {
      // Verificar se o fornecedor (providerId) existe
      const provider = await User.findById(providerId);
      if (!provider) {
        return res.status(400).json({ message: 'Fornecedor não encontrado.' });
      }
  
      // Verificar se o usuário é um prestador de serviço
      if (provider.role !== 'Service Provider') {
        return res.status(403).json({ message: 'Apenas prestadores de serviço podem criar serviços.' });
      }
  
      // Calcular a duração total do serviço (máximo de 30 dias * 8 horas/dia)
      const totalServiceDuration = calculateServiceDuration(serviceDurationDays);
  
      // Validar se a duração não excede o máximo permitido
      if (totalServiceDuration > 240) {
        return res.status(400).json({ message: 'A duração do serviço não pode exceder 30 dias (240 horas).' });
      }
  
      // Calcular a data de término
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + totalServiceDuration);
  
      // Criar o novo serviço
      const newService = new Service({
        provider: providerId,
        pricePerHour,
        images,
        category,
        location,
        serviceDuration: totalServiceDuration,
        startDate,
        endDate,
      });
  
      // Salvar o serviço no banco de dados
      await newService.save();
  
      return res.status(201).json(newService);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Erro ao criar o serviço.' });
    }
  };
  const getServicesByStatus = async (req, res) => {
    const { status } = req.params;
  
    try {
      const services = await Service.find({ status })
        .populate('provider', 'firstName lastName email avatar')  // Popula dados do provedor
        .sort({ createdAt: -1 });  // Ordena pelo mais recente
  
      if (!services || services.length === 0) {
        return res.status(404).json({ message: 'Nenhum serviço encontrado com o status fornecido.' });
      }
  
      res.status(200).json({ services });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar os serviços.' });
    }
  };
// Listar todos os serviços
const listServices = async (req, res) => {
  try {
    const services = await Service.find().populate('provider', 'firstName lastName email'); // Popula dados do provider
    return res.status(200).json(services);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Buscar serviço por ID
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('provider', 'firstName lastName email');
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    return res.status(200).json(service);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Atualizar serviço
const updateService = async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedService) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    return res.status(200).json(updatedService);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Excluir serviço (após 15 dias, o serviço será excluído automaticamente)
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    // Verificar se o serviço está expirado (mais de 15 dias desde o startDate)
    const currentDate = new Date();
    const serviceStartDate = new Date(service.startDate);
    const diffInTime = currentDate.getTime() - serviceStartDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);

    if (diffInDays > 15) {
      await service.remove();
      return res.status(200).json({ message: 'Serviço excluído automaticamente após 15 dias' });
    } else {
      return res.status(400).json({ message: 'O serviço não pode ser excluído antes de 15 dias' });
    }
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
// Buscar serviços por prestador
const getServicesByProvider = async (req, res) => {
  const { providerId } = req.params;

  try {
    const services = await Service.find({ provider: providerId })
      .populate('provider', 'firstName lastName email avatar')  // Popula dados do provedor
      .sort({ createdAt: -1 });  // Ordena pelo mais recente

    if (!services || services.length === 0) {
      return res.status(404).json({ message: 'Nenhum serviço encontrado para este prestador.' });
    }

    res.status(200).json({ services });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar os serviços.' });
  }
};
module.exports = {
  createService,
  listServices,
  getServiceById,
  getServicesByProvider,
  updateService,
  getServicesByStatus,
  deleteService,
};
