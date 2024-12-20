const Service = require('../models/Service');
const User = require('../models/User');  // Referência ao modelo de usuário

// Função para calcular a duração total do serviço em horas


const createService = async (req, res) => {
  const { providerId, pricePerHour, category, location} = req.body;

  try {
    // Verificar se o fornecedor (providerId) existe pelo campo personalizado
    const provider = await User.findOne({ providerId }); // Alterado para findOne e busca por providerId
    if (!provider) {
      return res.status(400).json({ message: 'Fornecedor não encontrado.' });
    }

    // Verificar se o usuário é um prestador de serviço
    if (provider.role !== 'service-provider') {
      return res.status(403).json({ message: 'Apenas prestadores de serviço podem criar serviços.' });
    }

    // Criar o novo serviço
    const newService = new Service({
      provider: provider._id, // Use o _id do MongoDB para associar o serviço ao usuário
      firstName: provider.firstName,
      lastName: provider.lastName,
      pricePerHour,
      category,
      location,
      status: 'active', // Status inicial
    });

    await newService.save();

    res.status(201).json({ message: 'Serviço criado com sucesso!', service: newService });
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ message: 'Erro ao criar serviço.' });
  }
};

const getServicesByStatus = async (req, res) => {
  const { status } = req.params;

  try {
    const services = await Service.find({ status })
      .populate('provider', 'firstName lastName email')  // Popula dados do provedor sem o avatar
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
    // Busca todos os serviços e popula os dados do provedor
    const services = await Service.find()
      .populate('provider', 'firstName lastName email') // Popula dados do provider sem o avatar
      .sort({ createdAt: -1 }); // Ordena pelo mais recente

    // Verifica se não há serviços disponíveis
    if (!services || services.length === 0) {
      return res.status(404).json({ message: 'Nenhum serviço disponível.' });
    }

    // Retorna os serviços encontrados com status 200
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
    return res .status(200).json(service);
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
      .populate('provider', 'firstName lastName email')  // Popula dados do provedor sem o avatar
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