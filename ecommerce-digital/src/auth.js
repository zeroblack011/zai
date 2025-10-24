// ========================================
// SISTEMA DE AUTENTICAÇÃO
// ========================================

import { generateJWT, verifyJWT, hashPassword } from './utils.js';

/**
 * Classe para gerenciar autenticação
 */
export class Auth {
  constructor(db, jwtSecret) {
    this.db = db;
    this.jwtSecret = jwtSecret;
  }

  /**
   * Registra novo usuário
   */
  async register(email, password, name, phone, cpf) {
    // Verificar se já existe
    const existing = await this.db.getCustomerByEmail(email);
    if (existing) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar cliente
    const customer = await this.db.createCustomer({
      email,
      passwordHash,
      name,
      phone,
      cpf
    });

    // Gerar token
    const token = await this.generateToken(customer);

    return { customer, token };
  }

  /**
   * Login
   */
  async login(email, password) {
    const customer = await this.db.getCustomerByEmail(email);
    if (!customer) {
      throw new Error('Email ou senha inválidos');
    }

    const passwordHash = await hashPassword(password);
    if (customer.passwordHash !== passwordHash) {
      throw new Error('Email ou senha inválidos');
    }

    const token = await this.generateToken(customer);

    return { customer, token };
  }

  /**
   * Verifica token e retorna usuário
   */
  async verifyToken(token) {
    if (!token) return null;

    const payload = await verifyJWT(token, this.jwtSecret);
    if (!payload) return null;

    const customer = await this.db.getCustomer(payload.customerId);
    return customer;
  }

  /**
   * Gera token JWT
   */
  async generateToken(customer) {
    const payload = {
      customerId: customer.id,
      email: customer.email,
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 dias
    };

    return await generateJWT(payload, this.jwtSecret);
  }

  /**
   * Extrai token do header Authorization
   */
  extractToken(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Middleware para rotas autenticadas
   */
  async authenticate(request) {
    const token = this.extractToken(request);
    const customer = await this.verifyToken(token);

    if (!customer) {
      throw new Error('Não autenticado');
    }

    return customer;
  }

  /**
   * Verifica se é admin (senha simples, em produção use sistema mais robusto)
   */
  async isAdmin(request, adminPassword) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return false;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Basic') {
      return false;
    }

    try {
      const decoded = atob(parts[1]);
      const [username, password] = decoded.split(':');

      return username === 'admin' && password === adminPassword;
    } catch (e) {
      return false;
    }
  }

  /**
   * Gera token de recuperação de senha
   */
  async generatePasswordResetToken(email) {
    const customer = await this.db.getCustomerByEmail(email);
    if (!customer) {
      throw new Error('Email não encontrado');
    }

    const resetToken = await generateJWT({
      customerId: customer.id,
      type: 'password_reset',
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
    }, this.jwtSecret);

    return resetToken;
  }

  /**
   * Reseta senha
   */
  async resetPassword(token, newPassword) {
    const payload = await verifyJWT(token, this.jwtSecret);
    if (!payload || payload.type !== 'password_reset') {
      throw new Error('Token inválido ou expirado');
    }

    const customer = await this.db.getCustomer(payload.customerId);
    if (!customer) {
      throw new Error('Cliente não encontrado');
    }

    const passwordHash = await hashPassword(newPassword);
    customer.passwordHash = passwordHash;
    customer.updatedAt = new Date().toISOString();

    await this.db.kv.put(`customer:${customer.id}`, JSON.stringify(customer));

    return customer;
  }
}
