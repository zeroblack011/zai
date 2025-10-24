// ========================================
// CLOUDFLARE WORKER - E-COMMERCE DIGITAL
// ========================================

import { Database } from './database.js';
import { Auth } from './auth.js';
import { AsaasClient, createPixPayment, createCreditCardPayment } from './asaas.js';
import { serveStaticFile } from './static.js';
import {
  jsonResponse,
  errorResponse,
  htmlResponse,
  parseFormData,
  isValidEmail,
  isValidCPF,
  generateId,
  RateLimiter
} from './utils.js';

/**
 * Router principal
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS para OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // Inicializar dependências
    const db = new Database(env.ECOMMERCE_DB);
    const auth = new Auth(db, env.JWT_SECRET || 'default-secret-change-me');
    const asaas = new AsaasClient(env.ASAAS_API_KEY, env.ENVIRONMENT || 'production');
    const rateLimiter = new RateLimiter(env.ECOMMERCE_DB);

    // Rate limiting
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const isAllowed = await rateLimiter.check(clientIp);
    if (!isAllowed && !path.startsWith('/static/')) {
      return errorResponse('Muitas requisições. Tente novamente em instantes.', 429);
    }

    try {
      // ==================== ROTAS PÚBLICAS HTML ====================

      if (path === '/' || path === '/index.html') {
        return await serveStaticFile('index.html', env.ECOMMERCE_DB);
      }

      if (path === '/servico.html') {
        return await serveStaticFile('servico.html', env.ECOMMERCE_DB);
      }

      if (path === '/checkout.html') {
        return await serveStaticFile('checkout.html', env.ECOMMERCE_DB);
      }

      if (path === '/creditos.html') {
        return await serveStaticFile('creditos.html', env.ECOMMERCE_DB);
      }

      if (path === '/painel-cliente.html') {
        return await serveStaticFile('painel-cliente.html', env.ECOMMERCE_DB);
      }

      if (path === '/painel-admin.html') {
        return await serveStaticFile('painel-admin.html', env.ECOMMERCE_DB);
      }

      if (path === '/login.html') {
        return await serveStaticFile('login.html', env.ECOMMERCE_DB);
      }

      if (path === '/registro.html') {
        return await serveStaticFile('registro.html', env.ECOMMERCE_DB);
      }

      // Arquivos estáticos (CSS/JS/imagens)
      if (path.startsWith('/css/') || path.startsWith('/js/') || path.startsWith('/img/')) {
        return await serveStaticFile(path.substring(1), env.ECOMMERCE_DB);
      }

      // ==================== API - CATÁLOGO ====================

      if (path === '/api/services' && request.method === 'GET') {
        const services = await db.getServices();
        return jsonResponse({ services });
      }

      if (path.match(/^\/api\/services\/(.+)$/) && request.method === 'GET') {
        const serviceId = path.split('/').pop();
        const service = await db.getService(serviceId);
        if (!service) {
          return errorResponse('Serviço não encontrado', 404);
        }
        return jsonResponse({ service });
      }

      if (path === '/api/credits/packages' && request.method === 'GET') {
        const packages = db.getCreditPackages();
        return jsonResponse({ packages });
      }

      // ==================== API - AUTENTICAÇÃO ====================

      if (path === '/api/auth/register' && request.method === 'POST') {
        const data = await parseFormData(request);

        if (!data.email || !isValidEmail(data.email)) {
          return errorResponse('Email inválido');
        }

        if (!data.password || data.password.length < 6) {
          return errorResponse('Senha deve ter no mínimo 6 caracteres');
        }

        if (!data.name || data.name.length < 3) {
          return errorResponse('Nome inválido');
        }

        if (!data.cpf || !isValidCPF(data.cpf)) {
          return errorResponse('CPF inválido');
        }

        try {
          const result = await auth.register(
            data.email,
            data.password,
            data.name,
            data.phone || '',
            data.cpf
          );

          return jsonResponse({
            success: true,
            token: result.token,
            customer: {
              id: result.customer.id,
              email: result.customer.email,
              name: result.customer.name,
              credits: result.customer.credits
            }
          });
        } catch (error) {
          return errorResponse(error.message);
        }
      }

      if (path === '/api/auth/login' && request.method === 'POST') {
        const data = await parseFormData(request);

        if (!data.email || !data.password) {
          return errorResponse('Email e senha são obrigatórios');
        }

        try {
          const result = await auth.login(data.email, data.password);

          return jsonResponse({
            success: true,
            token: result.token,
            customer: {
              id: result.customer.id,
              email: result.customer.email,
              name: result.customer.name,
              credits: result.customer.credits
            }
          });
        } catch (error) {
          return errorResponse(error.message, 401);
        }
      }

      if (path === '/api/auth/me' && request.method === 'GET') {
        try {
          const customer = await auth.authenticate(request);
          return jsonResponse({
            customer: {
              id: customer.id,
              email: customer.email,
              name: customer.name,
              credits: customer.credits,
              createdAt: customer.createdAt
            }
          });
        } catch (error) {
          return errorResponse(error.message, 401);
        }
      }

      // ==================== API - PEDIDOS ====================

      if (path === '/api/orders' && request.method === 'POST') {
        try {
          const customer = await auth.authenticate(request);
          const data = await parseFormData(request);

          const service = await db.getService(data.serviceId);
          if (!service) {
            return errorResponse('Serviço não encontrado', 404);
          }

          // Validar método de pagamento
          if (!['credits', 'pix', 'credit_card'].includes(data.paymentMethod)) {
            return errorResponse('Método de pagamento inválido');
          }

          // Se pagar com créditos, verificar saldo
          if (data.paymentMethod === 'credits') {
            if (customer.credits < service.credits) {
              return errorResponse('Créditos insuficientes');
            }

            // Debitar créditos
            await db.debitCustomerCredits(
              customer.id,
              service.credits,
              `Compra: ${service.name}`
            );

            // Criar pedido
            const order = await db.createOrder({
              customerId: customer.id,
              serviceId: service.id,
              serviceName: service.name,
              amount: service.price,
              paymentMethod: 'credits',
              formData: data.formData || {}
            });

            // Atualizar status para pago
            await db.updateOrderStatus(order.id, 'paid');

            return jsonResponse({
              success: true,
              order,
              message: 'Pedido criado com sucesso!'
            });
          }

          // Se pagar com PIX ou cartão, criar pedido pendente
          const order = await db.createOrder({
            customerId: customer.id,
            serviceId: service.id,
            serviceName: service.name,
            amount: service.price,
            paymentMethod: data.paymentMethod,
            formData: data.formData || {}
          });

          return jsonResponse({
            success: true,
            order,
            message: 'Pedido criado. Prossiga para o pagamento.',
            nextStep: `/api/payments/create`
          });

        } catch (error) {
          return errorResponse(error.message);
        }
      }

      if (path === '/api/orders/my' && request.method === 'GET') {
        try {
          const customer = await auth.authenticate(request);
          const orders = await db.getCustomerOrders(customer.id);
          return jsonResponse({ orders });
        } catch (error) {
          return errorResponse(error.message, 401);
        }
      }

      if (path.match(/^\/api\/orders\/(.+)$/) && request.method === 'GET') {
        try {
          const customer = await auth.authenticate(request);
          const orderId = path.split('/').pop();
          const order = await db.getOrder(orderId);

          if (!order) {
            return errorResponse('Pedido não encontrado', 404);
          }

          if (order.customerId !== customer.id) {
            return errorResponse('Acesso negado', 403);
          }

          return jsonResponse({ order });
        } catch (error) {
          return errorResponse(error.message, 401);
        }
      }

      // ==================== API - PAGAMENTOS ====================

      if (path === '/api/payments/create' && request.method === 'POST') {
        try {
          const customer = await auth.authenticate(request);
          const data = await parseFormData(request);

          const order = await db.getOrder(data.orderId);
          if (!order) {
            return errorResponse('Pedido não encontrado', 404);
          }

          if (order.customerId !== customer.id) {
            return errorResponse('Acesso negado', 403);
          }

          if (order.status !== 'pending') {
            return errorResponse('Pedido já processado');
          }

          const customerData = {
            asaasCustomerId: customer.asaasCustomerId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone || data.phone,
            cpf: customer.cpf,
            postalCode: data.postalCode,
            address: data.address,
            addressNumber: data.addressNumber,
            complement: data.complement,
            province: data.province
          };

          const orderData = {
            orderId: order.id,
            value: order.amount,
            description: `Pedido ${order.id} - ${order.serviceName}`,
            successUrl: `${url.origin}/painel-cliente.html?order=${order.id}`
          };

          // PIX
          if (order.paymentMethod === 'pix') {
            const pixPayment = await createPixPayment(asaas, customerData, orderData);

            // Atualizar pedido
            order.asaasPaymentId = pixPayment.paymentId;
            await db.kv.put(`order:${order.id}`, JSON.stringify(order));

            return jsonResponse({
              success: true,
              paymentMethod: 'pix',
              pix: {
                qrCode: pixPayment.pixQrCode,
                copyPaste: pixPayment.pixCopyPaste,
                expirationDate: pixPayment.expirationDate
              },
              invoiceUrl: pixPayment.invoiceUrl
            });
          }

          // Cartão de crédito
          if (order.paymentMethod === 'credit_card') {
            const cardData = {
              holderName: data.cardHolderName,
              number: data.cardNumber,
              expiryMonth: data.cardExpiryMonth,
              expiryYear: data.cardExpiryYear,
              ccv: data.cardCvv
            };

            orderData.installments = parseInt(data.installments) || 1;

            const cardPayment = await createCreditCardPayment(
              asaas,
              customerData,
              orderData,
              cardData
            );

            // Atualizar pedido
            order.asaasPaymentId = cardPayment.paymentId;
            await db.kv.put(`order:${order.id}`, JSON.stringify(order));

            // Se já confirmado, atualizar status
            if (cardPayment.status === 'CONFIRMED' || cardPayment.status === 'RECEIVED') {
              await db.updateOrderStatus(order.id, 'paid');
            }

            return jsonResponse({
              success: true,
              paymentMethod: 'credit_card',
              status: cardPayment.status,
              invoiceUrl: cardPayment.invoiceUrl
            });
          }

        } catch (error) {
          return errorResponse(error.message);
        }
      }

      // ==================== API - COMPRA DE CRÉDITOS ====================

      if (path === '/api/credits/purchase' && request.method === 'POST') {
        try {
          const customer = await auth.authenticate(request);
          const data = await parseFormData(request);

          const packages = db.getCreditPackages();
          const selectedPackage = packages.find(p => p.id === data.packageId);

          if (!selectedPackage) {
            return errorResponse('Pacote não encontrado', 404);
          }

          const customerData = {
            asaasCustomerId: customer.asaasCustomerId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone || data.phone,
            cpf: customer.cpf,
            postalCode: data.postalCode,
            address: data.address,
            addressNumber: data.addressNumber
          };

          const orderData = {
            orderId: `CREDITS-${generateId()}`,
            value: selectedPackage.price,
            description: `Compra de créditos - Pacote ${selectedPackage.name}`,
            successUrl: `${url.origin}/painel-cliente.html`
          };

          let paymentResult;

          // PIX
          if (data.paymentMethod === 'pix') {
            paymentResult = await createPixPayment(asaas, customerData, orderData);

            return jsonResponse({
              success: true,
              paymentMethod: 'pix',
              pix: {
                qrCode: paymentResult.pixQrCode,
                copyPaste: paymentResult.pixCopyPaste
              },
              packageId: selectedPackage.id,
              credits: selectedPackage.credits,
              asaasPaymentId: paymentResult.paymentId
            });
          }

          // Cartão
          if (data.paymentMethod === 'credit_card') {
            const cardData = {
              holderName: data.cardHolderName,
              number: data.cardNumber,
              expiryMonth: data.cardExpiryMonth,
              expiryYear: data.cardExpiryYear,
              ccv: data.cardCvv
            };

            orderData.installments = parseInt(data.installments) || 1;

            paymentResult = await createCreditCardPayment(asaas, customerData, orderData, cardData);

            // Se confirmado, adicionar créditos imediatamente
            if (paymentResult.status === 'CONFIRMED' || paymentResult.status === 'RECEIVED') {
              await db.addCustomerCredits(
                customer.id,
                selectedPackage.credits,
                `Compra do pacote ${selectedPackage.name}`
              );
            }

            return jsonResponse({
              success: true,
              paymentMethod: 'credit_card',
              status: paymentResult.status,
              packageId: selectedPackage.id,
              credits: selectedPackage.credits,
              asaasPaymentId: paymentResult.paymentId
            });
          }

        } catch (error) {
          return errorResponse(error.message);
        }
      }

      // ==================== WEBHOOKS ASAAS ====================

      if (path === '/api/webhooks/asaas' && request.method === 'POST') {
        try {
          const event = await request.json();
          const processed = await asaas.processWebhookEvent(event);

          // Se pagamento confirmado
          if (processed.type === 'confirmed' && processed.payment) {
            const paymentId = processed.payment.id;
            const externalRef = processed.payment.externalReference;

            // Se for compra de créditos
            if (externalRef && externalRef.startsWith('CREDITS-')) {
              // Buscar informações do pagamento para identificar pacote
              // Em produção, guardar essas informações ao criar o pagamento
              console.log('Créditos confirmados via webhook:', paymentId);
            }

            // Se for pedido normal
            if (externalRef && externalRef.startsWith('PED-')) {
              await db.updateOrderStatus(externalRef, 'paid');
              console.log('Pedido pago via webhook:', externalRef);
            }
          }

          return jsonResponse({ received: true });
        } catch (error) {
          console.error('Erro no webhook:', error);
          return jsonResponse({ received: true }); // Sempre retornar 200 para webhooks
        }
      }

      // ==================== API - ADMIN ====================

      if (path === '/api/admin/orders' && request.method === 'GET') {
        const isAdmin = await auth.isAdmin(request, env.ADMIN_PASSWORD || 'admin123');
        if (!isAdmin) {
          return errorResponse('Acesso negado', 403);
        }

        const status = url.searchParams.get('status');
        const orders = await db.getAllOrders(100, status);

        return jsonResponse({ orders });
      }

      if (path.match(/^\/api\/admin\/orders\/(.+)\/status$/) && request.method === 'PUT') {
        const isAdmin = await auth.isAdmin(request, env.ADMIN_PASSWORD || 'admin123');
        if (!isAdmin) {
          return errorResponse('Acesso negado', 403);
        }

        const orderId = path.split('/')[4];
        const data = await parseFormData(request);

        const order = await db.updateOrderStatus(orderId, data.status, data.notes);

        if (!order) {
          return errorResponse('Pedido não encontrado', 404);
        }

        return jsonResponse({ success: true, order });
      }

      // ==================== 404 ====================

      return errorResponse('Rota não encontrada', 404);

    } catch (error) {
      console.error('Erro no worker:', error);
      return errorResponse('Erro interno do servidor', 500);
    }
  }
};

