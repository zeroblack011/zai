// ========================================
// INTEGRAÇÃO ASAAS API
// ========================================

/**
 * Cliente Asaas API
 */
export class AsaasClient {
  constructor(apiKey, environment = 'production') {
    this.apiKey = apiKey;
    this.baseUrl = environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  /**
   * Faz requisição à API
   */
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.errors?.[0]?.description || 'Erro na API Asaas');
    }

    return result;
  }

  // ==================== CLIENTES ====================

  /**
   * Cria cliente no Asaas
   */
  async createCustomer(data) {
    return await this.request('/customers', 'POST', {
      name: data.name,
      email: data.email,
      phone: data.phone,
      mobilePhone: data.phone,
      cpfCnpj: data.cpf,
      postalCode: data.postalCode,
      address: data.address,
      addressNumber: data.addressNumber,
      complement: data.complement,
      province: data.province,
      externalReference: data.externalReference,
      notificationDisabled: false,
      emailsOptOut: false
    });
  }

  /**
   * Busca cliente
   */
  async getCustomer(customerId) {
    return await this.request(`/customers/${customerId}`);
  }

  /**
   * Atualiza cliente
   */
  async updateCustomer(customerId, data) {
    return await this.request(`/customers/${customerId}`, 'PUT', data);
  }

  // ==================== COBRANÇAS ====================

  /**
   * Cria cobrança
   */
  async createPayment(data) {
    const paymentData = {
      customer: data.customerId, // ID do cliente Asaas
      billingType: data.billingType, // 'PIX', 'CREDIT_CARD', 'BOLETO'
      value: data.value,
      dueDate: data.dueDate || this.getTodayDate(),
      description: data.description,
      externalReference: data.externalReference,
      installmentCount: data.installmentCount || 1,
      installmentValue: data.installmentValue,
      discount: data.discount,
      interest: data.interest,
      fine: data.fine,
      postalService: false,
      callback: {
        successUrl: data.successUrl,
        autoRedirect: true
      }
    };

    // Dados específicos para cartão de crédito
    if (data.billingType === 'CREDIT_CARD' && data.creditCard) {
      paymentData.creditCard = {
        holderName: data.creditCard.holderName,
        number: data.creditCard.number,
        expiryMonth: data.creditCard.expiryMonth,
        expiryYear: data.creditCard.expiryYear,
        ccv: data.creditCard.ccv
      };

      paymentData.creditCardHolderInfo = {
        name: data.creditCardHolder.name,
        email: data.creditCardHolder.email,
        cpfCnpj: data.creditCardHolder.cpfCnpj,
        postalCode: data.creditCardHolder.postalCode,
        addressNumber: data.creditCardHolder.addressNumber,
        phone: data.creditCardHolder.phone,
        mobilePhone: data.creditCardHolder.mobilePhone
      };
    }

    return await this.request('/payments', 'POST', paymentData);
  }

  /**
   * Busca cobrança
   */
  async getPayment(paymentId) {
    return await this.request(`/payments/${paymentId}`);
  }

  /**
   * Gera QR Code PIX
   */
  async getPixQrCode(paymentId) {
    return await this.request(`/payments/${paymentId}/pixQrCode`);
  }

  /**
   * Confirma se pagamento foi recebido
   */
  async checkPaymentStatus(paymentId) {
    const payment = await this.getPayment(paymentId);
    return {
      id: payment.id,
      status: payment.status, // PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, etc.
      value: payment.value,
      netValue: payment.netValue,
      paymentDate: payment.paymentDate,
      confirmedDate: payment.confirmedDate,
      billingType: payment.billingType
    };
  }

  /**
   * Cancela cobrança
   */
  async cancelPayment(paymentId) {
    return await this.request(`/payments/${paymentId}`, 'DELETE');
  }

  /**
   * Estorna pagamento
   */
  async refundPayment(paymentId, value = null, description = '') {
    return await this.request(`/payments/${paymentId}/refund`, 'POST', {
      value,
      description
    });
  }

  // ==================== ASSINATURAS (para serviços recorrentes) ====================

  /**
   * Cria assinatura
   */
  async createSubscription(data) {
    return await this.request('/subscriptions', 'POST', {
      customer: data.customerId,
      billingType: data.billingType,
      value: data.value,
      nextDueDate: data.nextDueDate,
      cycle: data.cycle, // 'MONTHLY', 'QUARTERLY', 'YEARLY'
      description: data.description,
      endDate: data.endDate,
      maxPayments: data.maxPayments,
      externalReference: data.externalReference
    });
  }

  /**
   * Busca assinatura
   */
  async getSubscription(subscriptionId) {
    return await this.request(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Cancela assinatura
   */
  async cancelSubscription(subscriptionId) {
    return await this.request(`/subscriptions/${subscriptionId}`, 'DELETE');
  }

  // ==================== WEBHOOKS ====================

  /**
   * Valida webhook do Asaas
   */
  validateWebhook(payload, signature, webhookSecret) {
    // Em produção, implemente validação de assinatura
    return true;
  }

  /**
   * Processa evento de webhook
   */
  async processWebhookEvent(event) {
    const eventType = event.event;
    const payment = event.payment;

    switch (eventType) {
      case 'PAYMENT_CREATED':
        return { type: 'created', payment };

      case 'PAYMENT_UPDATED':
        return { type: 'updated', payment };

      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        return { type: 'confirmed', payment };

      case 'PAYMENT_OVERDUE':
        return { type: 'overdue', payment };

      case 'PAYMENT_DELETED':
        return { type: 'deleted', payment };

      case 'PAYMENT_REFUNDED':
        return { type: 'refunded', payment };

      default:
        return { type: 'unknown', payment };
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Retorna data de hoje no formato YYYY-MM-DD
   */
  getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Retorna data futura
   */
  getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calcula valor de parcela
   */
  calculateInstallmentValue(totalValue, installments, interestRate = 0) {
    if (installments === 1) return totalValue;

    // Juros compostos
    if (interestRate > 0) {
      const rate = interestRate / 100;
      const installmentValue = totalValue * (rate * Math.pow(1 + rate, installments)) /
                               (Math.pow(1 + rate, installments) - 1);
      return Math.round(installmentValue * 100) / 100;
    }

    return Math.round((totalValue / installments) * 100) / 100;
  }

  /**
   * Valida número de cartão (Algoritmo de Luhn)
   */
  validateCardNumber(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Identifica bandeira do cartão
   */
  getCardBrand(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');

    if (/^4/.test(digits)) return 'VISA';
    if (/^5[1-5]/.test(digits)) return 'MASTERCARD';
    if (/^3[47]/.test(digits)) return 'AMEX';
    if (/^6(?:011|5)/.test(digits)) return 'DISCOVER';
    if (/^35/.test(digits)) return 'JCB';
    if (/^(?:2131|1800|35)/.test(digits)) return 'JCB';
    if (/^3(?:0[0-5]|[68])/.test(digits)) return 'DINERS';
    if (/^(?:5[0678]|6304|6390|67)/.test(digits)) return 'MAESTRO';
    if (/^(606282|3841)/.test(digits)) return 'HIPERCARD';
    if (/^(636368|438935|504175|451416|636297)/.test(digits)) return 'ELO';

    return 'UNKNOWN';
  }
}

/**
 * Helper para criar pagamento PIX
 */
export async function createPixPayment(asaas, customerData, orderData) {
  // Criar ou buscar cliente
  let asaasCustomer;
  if (customerData.asaasCustomerId) {
    asaasCustomer = await asaas.getCustomer(customerData.asaasCustomerId);
  } else {
    asaasCustomer = await asaas.createCustomer(customerData);
  }

  // Criar cobrança PIX
  const payment = await asaas.createPayment({
    customerId: asaasCustomer.id,
    billingType: 'PIX',
    value: orderData.value,
    description: orderData.description,
    externalReference: orderData.orderId,
    successUrl: orderData.successUrl
  });

  // Buscar QR Code
  const pixData = await asaas.getPixQrCode(payment.id);

  return {
    paymentId: payment.id,
    invoiceUrl: payment.invoiceUrl,
    pixCopyPaste: pixData.payload,
    pixQrCode: pixData.encodedImage,
    expirationDate: pixData.expirationDate
  };
}

/**
 * Helper para criar pagamento com cartão
 */
export async function createCreditCardPayment(asaas, customerData, orderData, cardData) {
  // Criar ou buscar cliente
  let asaasCustomer;
  if (customerData.asaasCustomerId) {
    asaasCustomer = await asaas.getCustomer(customerData.asaasCustomerId);
  } else {
    asaasCustomer = await asaas.createCustomer(customerData);
  }

  // Calcular parcelas se necessário
  const installmentValue = orderData.installments > 1
    ? asaas.calculateInstallmentValue(orderData.value, orderData.installments)
    : orderData.value;

  // Criar cobrança
  const payment = await asaas.createPayment({
    customerId: asaasCustomer.id,
    billingType: 'CREDIT_CARD',
    value: orderData.value,
    description: orderData.description,
    externalReference: orderData.orderId,
    installmentCount: orderData.installments || 1,
    installmentValue,
    successUrl: orderData.successUrl,
    creditCard: {
      holderName: cardData.holderName,
      number: cardData.number,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      ccv: cardData.ccv
    },
    creditCardHolder: {
      name: customerData.name,
      email: customerData.email,
      cpfCnpj: customerData.cpf,
      postalCode: customerData.postalCode,
      addressNumber: customerData.addressNumber,
      phone: customerData.phone,
      mobilePhone: customerData.phone
    }
  });

  return {
    paymentId: payment.id,
    status: payment.status,
    invoiceUrl: payment.invoiceUrl
  };
}
