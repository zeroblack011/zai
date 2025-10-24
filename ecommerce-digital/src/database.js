// ========================================
// CLOUDFLARE KV DATABASE HELPERS
// ========================================

/**
 * Classe para gerenciar operações do banco de dados
 */
export class Database {
  constructor(kv) {
    this.kv = kv;
  }

  // ==================== SERVIÇOS ====================

  /**
   * Retorna todos os serviços do catálogo
   */
  async getServices() {
    const cached = await this.kv.get('services', 'json');
    if (cached) return cached;

    // Catálogo inicial
    const services = [
      {
        id: 'llc-eua',
        name: 'LLC EUA Completa',
        price: 2997,
        credits: 2997,
        category: 'empresa',
        description: 'Empresa LLC completa nos EUA com EIN, conta bancária e endereço fiscal',
        features: [
          'Registro da LLC em Delaware ou Wyoming',
          'EIN (Employer Identification Number)',
          'Conta bancária empresarial',
          'Endereço fiscal nos EUA',
          'Registered Agent por 1 ano',
          'Suporte completo em português'
        ],
        deliveryTime: '15-20 dias úteis',
        image: '🏢',
        popular: true
      },
      {
        id: 'tiktok-shop-br',
        name: 'TikTok Shop Brasil',
        price: 497,
        credits: 497,
        category: 'marketplace',
        description: 'Conta TikTok Shop aprovada e pronta para vender no Brasil',
        features: [
          'Conta TikTok Shop ativada',
          'Verificação completa',
          'Centro de vendedores configurado',
          'Tutoriais de uso',
          'Suporte pós-ativação'
        ],
        deliveryTime: '3-5 dias úteis',
        image: '🛍️',
        popular: true
      },
      {
        id: 'tiktok-shop-us',
        name: 'TikTok Shop USA',
        price: 997,
        credits: 997,
        category: 'marketplace',
        description: 'Conta TikTok Shop aprovada para vender nos Estados Unidos',
        features: [
          'Conta TikTok Shop US ativada',
          'Documentação completa',
          'SSN ou EIN configurado',
          'Centro de vendedores pronto',
          'Guia de vendas internacionais'
        ],
        deliveryTime: '7-10 dias úteis',
        image: '🛍️',
        popular: false
      },
      {
        id: 'tiktok-shop-uk',
        name: 'TikTok Shop UK',
        price: 997,
        credits: 997,
        category: 'marketplace',
        description: 'Conta TikTok Shop aprovada para vender no Reino Unido',
        features: [
          'Conta TikTok Shop UK ativada',
          'Documentação britânica',
          'VAT configurado',
          'Centro de vendedores configurado',
          'Suporte em português'
        ],
        deliveryTime: '7-10 dias úteis',
        image: '🛍️',
        popular: false
      },
      {
        id: 'proxy-brasil',
        name: 'Proxy Brasil',
        price: 37,
        credits: 37,
        category: 'infraestrutura',
        recurring: 'monthly',
        description: 'Proxy residencial brasileiro de alta qualidade',
        features: [
          'IP brasileiro residencial',
          'Velocidade de 100Mbps',
          'Uptime 99.9%',
          'Ilimitado tráfego',
          'Suporte 24/7'
        ],
        deliveryTime: 'Imediato',
        image: '🌐',
        popular: false
      },
      {
        id: 'proxy-usa',
        name: 'Proxy USA',
        price: 65,
        credits: 65,
        category: 'infraestrutura',
        recurring: 'monthly',
        description: 'Proxy residencial americano de alta performance',
        features: [
          'IP americano residencial',
          'Velocidade de 1Gbps',
          'Uptime 99.9%',
          'Tráfego ilimitado',
          'Rotação automática'
        ],
        deliveryTime: 'Imediato',
        image: '🌐',
        popular: false
      },
      {
        id: 'fabricante-dropshipping',
        name: 'Fabricante Dropshipping',
        price: 97,
        credits: 97,
        category: 'fornecedor',
        description: 'Acesso a fabricantes confiáveis para dropshipping',
        features: [
          'Lista de 50+ fabricantes verificados',
          'Contatos diretos',
          'Preços de atacado',
          'Produtos validados',
          'Atualizações mensais'
        ],
        deliveryTime: '1-2 dias úteis',
        image: '👕',
        popular: false
      },
      {
        id: 'ia-anuncios',
        name: 'IA para Anúncios',
        price: 147,
        credits: 147,
        category: 'marketing',
        recurring: 'monthly',
        description: 'Inteligência Artificial para criação de anúncios de alta conversão',
        features: [
          'Geração de copies persuasivos',
          'Criação de headlines',
          'Análise de concorrentes',
          'Otimização A/B',
          'Relatórios de performance'
        ],
        deliveryTime: 'Imediato',
        image: '🤖',
        popular: true
      },
      {
        id: 'app-personalizado',
        name: 'App Personalizado',
        price: 4997,
        credits: 4997,
        category: 'desenvolvimento',
        description: 'Aplicativo mobile personalizado para iOS e Android',
        features: [
          'Design exclusivo',
          'Desenvolvimento nativo',
          'Backend completo',
          'Publicação nas lojas',
          '3 meses de suporte',
          'Manutenções incluídas'
        ],
        deliveryTime: '30-45 dias úteis',
        image: '📱',
        popular: false
      },
      {
        id: 'bm-facebook',
        name: 'Business Manager Facebook',
        price: 350,
        credits: 350,
        category: 'ads',
        description: 'Business Manager Facebook verificado e sem limites',
        features: [
          'BM verificado',
          'Sem limites de gastos',
          'Múltiplas contas de anúncios',
          'Pixels configurados',
          'Suporte de configuração'
        ],
        deliveryTime: '2-3 dias úteis',
        image: '🔐',
        popular: true
      },
      {
        id: 'bm-tiktok',
        name: 'Business Manager TikTok',
        price: 300,
        credits: 300,
        category: 'ads',
        description: 'TikTok Ads Manager verificado e pronto para anunciar',
        features: [
          'Conta verificada',
          'Centro de anúncios ativo',
          'Pixel TikTok instalado',
          'Créditos de teste',
          'Tutoriais inclusos'
        ],
        deliveryTime: '2-3 dias úteis',
        image: '🔐',
        popular: false
      },
      {
        id: 'bm-google',
        name: 'Business Manager Google',
        price: 450,
        credits: 450,
        category: 'ads',
        description: 'Google Ads Manager verificado com limite alto',
        features: [
          'Conta Google Ads verificada',
          'Limite de gastos alto',
          'Google Analytics configurado',
          'Conversões configuradas',
          'Certificação de suporte'
        ],
        deliveryTime: '3-5 dias úteis',
        image: '🔐',
        popular: false
      },
      {
        id: 'site-ecommerce',
        name: 'Site E-commerce',
        price: 1997,
        credits: 1997,
        category: 'desenvolvimento',
        description: 'Loja virtual completa e profissional',
        features: [
          'Design responsivo',
          'Painel administrativo',
          'Gateway de pagamento',
          'Gestão de produtos',
          'SEO otimizado',
          '6 meses de hospedagem'
        ],
        deliveryTime: '10-15 dias úteis',
        image: '🌐',
        popular: true
      },
      {
        id: 'consultoria-juridica',
        name: 'Consultoria Jurídica',
        price: 180,
        credits: 180,
        category: 'consultoria',
        recurring: 'per-session',
        description: 'Consultoria jurídica especializada em e-commerce',
        features: [
          '1 hora de consultoria',
          'Advogado especializado',
          'Análise de contratos',
          'Orientações legais',
          'Relatório por escrito'
        ],
        deliveryTime: '1-2 dias para agendar',
        image: '⚖️',
        popular: false
      }
    ];

    await this.kv.put('services', JSON.stringify(services));
    return services;
  }

  /**
   * Retorna um serviço específico
   */
  async getService(id) {
    const services = await this.getServices();
    return services.find(s => s.id === id);
  }

  // ==================== PACOTES DE CRÉDITOS ====================

  /**
   * Retorna pacotes de créditos
   */
  getCreditPackages() {
    return [
      {
        id: 'starter',
        name: 'Starter',
        price: 497,
        credits: 600,
        discount: 20.7,
        popular: false,
        features: [
          '600 créditos',
          'Economia de R$ 103',
          'Válido por 12 meses',
          'Todos os serviços'
        ]
      },
      {
        id: 'business',
        name: 'Business',
        price: 997,
        credits: 1400,
        discount: 40.4,
        popular: true,
        features: [
          '1.400 créditos',
          'Economia de R$ 403',
          'Válido por 12 meses',
          'Suporte prioritário'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 2997,
        credits: 5000,
        discount: 66.8,
        popular: false,
        features: [
          '5.000 créditos',
          'Economia de R$ 2.003',
          'Válido por 18 meses',
          'Suporte VIP'
        ]
      },
      {
        id: 'empire',
        name: 'Empire',
        price: 4997,
        credits: 10000,
        discount: 100.0,
        popular: false,
        features: [
          '10.000 créditos',
          'Economia de R$ 5.003',
          'Válido por 24 meses',
          'Gerente de conta dedicado'
        ]
      }
    ];
  }

  // ==================== CLIENTES ====================

  /**
   * Cria novo cliente
   */
  async createCustomer(data) {
    const customerId = data.id || `CLI-${Date.now()}`;
    const customer = {
      id: customerId,
      email: data.email,
      name: data.name,
      phone: data.phone,
      cpf: data.cpf,
      credits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      asaasCustomerId: data.asaasCustomerId || null
    };

    await this.kv.put(`customer:${customerId}`, JSON.stringify(customer));
    await this.kv.put(`customer:email:${data.email}`, customerId);

    return customer;
  }

  /**
   * Busca cliente por email
   */
  async getCustomerByEmail(email) {
    const customerId = await this.kv.get(`customer:email:${email}`);
    if (!customerId) return null;

    const customer = await this.kv.get(`customer:${customerId}`, 'json');
    return customer;
  }

  /**
   * Busca cliente por ID
   */
  async getCustomer(customerId) {
    const customer = await this.kv.get(`customer:${customerId}`, 'json');
    return customer;
  }

  /**
   * Atualiza créditos do cliente
   */
  async updateCustomerCredits(customerId, credits) {
    const customer = await this.getCustomer(customerId);
    if (!customer) return null;

    customer.credits = credits;
    customer.updatedAt = new Date().toISOString();

    await this.kv.put(`customer:${customerId}`, JSON.stringify(customer));
    return customer;
  }

  /**
   * Adiciona créditos ao cliente
   */
  async addCustomerCredits(customerId, amount, description) {
    const customer = await this.getCustomer(customerId);
    if (!customer) return null;

    customer.credits = (customer.credits || 0) + amount;
    customer.updatedAt = new Date().toISOString();

    await this.kv.put(`customer:${customerId}`, JSON.stringify(customer));

    // Registrar transação
    await this.createCreditTransaction({
      customerId,
      amount,
      type: 'credit',
      description,
      balanceAfter: customer.credits
    });

    return customer;
  }

  /**
   * Debita créditos do cliente
   */
  async debitCustomerCredits(customerId, amount, description) {
    const customer = await this.getCustomer(customerId);
    if (!customer) return null;

    if (customer.credits < amount) {
      throw new Error('Créditos insuficientes');
    }

    customer.credits -= amount;
    customer.updatedAt = new Date().toISOString();

    await this.kv.put(`customer:${customerId}`, JSON.stringify(customer));

    // Registrar transação
    await this.createCreditTransaction({
      customerId,
      amount: -amount,
      type: 'debit',
      description,
      balanceAfter: customer.credits
    });

    return customer;
  }

  // ==================== TRANSAÇÕES DE CRÉDITOS ====================

  /**
   * Cria transação de crédito
   */
  async createCreditTransaction(data) {
    const transactionId = `TXN-${Date.now()}`;
    const transaction = {
      id: transactionId,
      customerId: data.customerId,
      amount: data.amount,
      type: data.type,
      description: data.description,
      balanceAfter: data.balanceAfter,
      createdAt: new Date().toISOString()
    };

    await this.kv.put(`transaction:${transactionId}`, JSON.stringify(transaction));

    // Adicionar à lista de transações do cliente
    const listKey = `transactions:customer:${data.customerId}`;
    const list = await this.kv.get(listKey, 'json') || [];
    list.unshift(transactionId);
    await this.kv.put(listKey, JSON.stringify(list.slice(0, 100))); // Manter últimas 100

    return transaction;
  }

  /**
   * Busca transações do cliente
   */
  async getCustomerTransactions(customerId, limit = 50) {
    const listKey = `transactions:customer:${customerId}`;
    const list = await this.kv.get(listKey, 'json') || [];

    const transactions = [];
    for (const txnId of list.slice(0, limit)) {
      const txn = await this.kv.get(`transaction:${txnId}`, 'json');
      if (txn) transactions.push(txn);
    }

    return transactions;
  }

  // ==================== PEDIDOS ====================

  /**
   * Cria novo pedido
   */
  async createOrder(data) {
    const orderId = `PED-${Date.now()}`;
    const order = {
      id: orderId,
      customerId: data.customerId,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      amount: data.amount,
      paymentMethod: data.paymentMethod, // 'credits', 'pix', 'credit_card'
      status: 'pending', // pending, paid, processing, completed, cancelled
      formData: data.formData || {},
      asaasPaymentId: data.asaasPaymentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      deliveryFiles: []
    };

    await this.kv.put(`order:${orderId}`, JSON.stringify(order));

    // Adicionar à lista de pedidos do cliente
    const listKey = `orders:customer:${data.customerId}`;
    const list = await this.kv.get(listKey, 'json') || [];
    list.unshift(orderId);
    await this.kv.put(listKey, JSON.stringify(list));

    // Adicionar à fila geral de pedidos
    const allOrdersKey = 'orders:all';
    const allOrders = await this.kv.get(allOrdersKey, 'json') || [];
    allOrders.unshift(orderId);
    await this.kv.put(allOrdersKey, JSON.stringify(allOrders.slice(0, 1000))); // Manter últimos 1000

    return order;
  }

  /**
   * Busca pedido
   */
  async getOrder(orderId) {
    const order = await this.kv.get(`order:${orderId}`, 'json');
    return order;
  }

  /**
   * Atualiza status do pedido
   */
  async updateOrderStatus(orderId, status, notes = '') {
    const order = await this.getOrder(orderId);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (status === 'completed') {
      order.completedAt = new Date().toISOString();
    }

    if (notes) {
      order.notes = notes;
    }

    await this.kv.put(`order:${orderId}`, JSON.stringify(order));
    return order;
  }

  /**
   * Busca pedidos do cliente
   */
  async getCustomerOrders(customerId, limit = 50) {
    const listKey = `orders:customer:${customerId}`;
    const list = await this.kv.get(listKey, 'json') || [];

    const orders = [];
    for (const orderId of list.slice(0, limit)) {
      const order = await this.kv.get(`order:${orderId}`, 'json');
      if (order) orders.push(order);
    }

    return orders;
  }

  /**
   * Busca todos os pedidos (para admin)
   */
  async getAllOrders(limit = 100, status = null) {
    const allOrdersKey = 'orders:all';
    const list = await this.kv.get(allOrdersKey, 'json') || [];

    const orders = [];
    for (const orderId of list.slice(0, limit)) {
      const order = await this.kv.get(`order:${orderId}`, 'json');
      if (order && (!status || order.status === status)) {
        orders.push(order);
      }
    }

    return orders;
  }

  // ==================== CONFIGURAÇÕES ====================

  /**
   * Salva configuração
   */
  async setConfig(key, value) {
    await this.kv.put(`config:${key}`, JSON.stringify(value));
  }

  /**
   * Busca configuração
   */
  async getConfig(key, defaultValue = null) {
    const value = await this.kv.get(`config:${key}`, 'json');
    return value !== null ? value : defaultValue;
  }
}
