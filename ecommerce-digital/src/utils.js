// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Gera um ID único
 */
export function generateId(prefix = 'ID') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}${random}`.toUpperCase();
}

/**
 * Formata valor para Real brasileiro
 */
export function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Valida email
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

/**
 * Sanitiza string
 */
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '');
}

/**
 * Cria hash simples (para senhas use bcrypt em produção)
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Gera token JWT simples
 */
export async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));

  const signature = await sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifica token JWT
 */
export async function verifyJWT(token, secret) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    const expectedSignature = await sign(`${encodedHeader}.${encodedPayload}`, secret);

    if (signature !== expectedSignature) {
      return null;
    }

    return JSON.parse(atob(encodedPayload));
  } catch (e) {
    return null;
  }
}

/**
 * Assina mensagem
 */
async function sign(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Resposta JSON padronizada
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

/**
 * Resposta HTML
 */
export function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    }
  });
}

/**
 * Resposta de erro
 */
export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

/**
 * Calcula data de expiração
 */
export function getExpirationDate(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Formata data brasileira
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Extrai dados de formulário
 */
export async function parseFormData(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await request.json();
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const data = {};
    for (const [key, value] of params) {
      data[key] = value;
    }
    return data;
  }

  return {};
}

/**
 * Rate limiting simples
 */
export class RateLimiter {
  constructor(kv, limit = 100, windowMs = 60000) {
    this.kv = kv;
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async check(ip) {
    const key = `ratelimit:${ip}`;
    const data = await this.kv.get(key, 'json');

    const now = Date.now();

    if (!data) {
      await this.kv.put(key, JSON.stringify({ count: 1, resetAt: now + this.windowMs }), {
        expirationTtl: Math.floor(this.windowMs / 1000)
      });
      return true;
    }

    if (now > data.resetAt) {
      await this.kv.put(key, JSON.stringify({ count: 1, resetAt: now + this.windowMs }), {
        expirationTtl: Math.floor(this.windowMs / 1000)
      });
      return true;
    }

    if (data.count >= this.limit) {
      return false;
    }

    await this.kv.put(key, JSON.stringify({ count: data.count + 1, resetAt: data.resetAt }), {
      expirationTtl: Math.floor((data.resetAt - now) / 1000)
    });

    return true;
  }
}
