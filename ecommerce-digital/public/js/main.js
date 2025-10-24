// ========================================
// JAVASCRIPT PRINCIPAL - FUNÇÕES GLOBAIS
// ========================================

// Configuração da API
const API_URL = window.location.origin;

// Estado global
const AppState = {
  user: null,
  token: null
};

// ==================== AUTENTICAÇÃO ====================

/**
 * Verifica se usuário está autenticado
 */
async function checkAuth() {
  const token = localStorage.getItem('authToken');

  if (!token) {
    AppState.user = null;
    AppState.token = null;
    updateAuthUI();
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      AppState.user = data.customer;
      AppState.token = token;
      updateAuthUI();
      return true;
    } else {
      // Token inválido
      logout();
      return false;
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return false;
  }
}

/**
 * Atualiza UI com base no estado de autenticação
 */
function updateAuthUI() {
  const authButton = document.getElementById('authButton');

  if (!authButton) return;

  if (AppState.user) {
    authButton.textContent = AppState.user.name;
    authButton.href = '/painel-cliente.html';
    authButton.classList.remove('btn-primary');
    authButton.classList.add('btn-secondary');

    // Adicionar botão de logout se não existir
    let logoutBtn = document.getElementById('logoutButton');
    if (!logoutBtn) {
      logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutButton';
      logoutBtn.textContent = 'Sair';
      logoutBtn.className = 'btn btn-sm btn-outline';
      logoutBtn.onclick = logout;
      authButton.parentNode.insertBefore(logoutBtn, authButton.nextSibling);
    }
  } else {
    authButton.textContent = 'Login';
    authButton.href = '/login.html';
    authButton.classList.remove('btn-secondary');
    authButton.classList.add('btn-primary');

    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) logoutBtn.remove();
  }
}

/**
 * Logout
 */
function logout() {
  localStorage.removeItem('authToken');
  AppState.user = null;
  AppState.token = null;
  window.location.href = '/login.html';
}

/**
 * Faz login
 */
async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('authToken', data.token);
      AppState.user = data.customer;
      AppState.token = data.token;
      return { success: true, user: data.customer };
    } else {
      return { success: false, error: data.error || 'Erro ao fazer login' };
    }
  } catch (error) {
    return { success: false, error: 'Erro de conexão' };
  }
}

/**
 * Faz registro
 */
async function register(userData) {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('authToken', data.token);
      AppState.user = data.customer;
      AppState.token = data.token;
      return { success: true, user: data.customer };
    } else {
      return { success: false, error: data.error || 'Erro ao criar conta' };
    }
  } catch (error) {
    return { success: false, error: 'Erro de conexão' };
  }
}

/**
 * Requer autenticação
 */
async function requireAuth() {
  const isAuth = await checkAuth();
  if (!isAuth) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

// ==================== UTILIDADES ====================

/**
 * Formata moeda
 */
function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formata data
 */
function formatDate(dateString) {
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
 * Mostra toast/notificação
 */
function showToast(message, type = 'info') {
  // Remover toast anterior se existir
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'var(--secondary)' : type === 'error' ? 'var(--accent)' : 'var(--primary)'};
      color: white;
      padding: 16px 24px;
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
    ">
      ${message}
    </div>
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Mostra loading overlay
 */
function showLoading(message = 'Carregando...') {
  const overlay = document.createElement('div');
  overlay.id = 'loadingOverlay';
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div style="text-align: center;">
      <div class="loading loading-lg" style="border-color: var(--primary); border-top-color: transparent;"></div>
      <p style="margin-top: 16px; font-weight: 600; color: var(--primary);">${message}</p>
    </div>
  `;

  document.body.appendChild(overlay);
}

/**
 * Esconde loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.remove();
}

/**
 * Valida email
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida CPF
 */
function isValidCPF(cpf) {
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
 * Formata CPF
 */
function formatCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
  cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return cpf;
}

/**
 * Formata telefone
 */
function formatPhone(phone) {
  phone = phone.replace(/\D/g, '');
  if (phone.length === 11) {
    phone = phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (phone.length === 10) {
    phone = phone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Formata número de cartão
 */
function formatCardNumber(number) {
  number = number.replace(/\D/g, '');
  number = number.replace(/(\d{4})(?=\d)/g, '$1 ');
  return number;
}

/**
 * Copia texto para clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copiado!', 'success');
    return true;
  } catch (error) {
    console.error('Erro ao copiar:', error);
    return false;
  }
}

/**
 * Abre modal
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Fecha modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Fechar modais ao clicar fora
 */
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ==================== API HELPERS ====================

/**
 * Faz requisição autenticada
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado
        logout();
      }
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Busca serviços
 */
async function getServices() {
  return await apiRequest('/api/services');
}

/**
 * Busca serviço específico
 */
async function getService(id) {
  return await apiRequest(`/api/services/${id}`);
}

/**
 * Busca pacotes de créditos
 */
async function getCreditPackages() {
  return await apiRequest('/api/credits/packages');
}

/**
 * Cria pedido
 */
async function createOrder(orderData) {
  return await apiRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
}

/**
 * Busca pedidos do usuário
 */
async function getMyOrders() {
  return await apiRequest('/api/orders/my');
}

/**
 * Busca pedido específico
 */
async function getOrder(orderId) {
  return await apiRequest(`/api/orders/${orderId}`);
}

/**
 * Cria pagamento
 */
async function createPayment(paymentData) {
  return await apiRequest('/api/payments/create', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
}

/**
 * Compra créditos
 */
async function purchaseCredits(purchaseData) {
  return await apiRequest('/api/credits/purchase', {
    method: 'POST',
    body: JSON.stringify(purchaseData)
  });
}

// ==================== MÁSCARAS DE INPUT ====================

/**
 * Aplica máscara de CPF
 */
function applyCPFMask(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 11);

    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
    }

    e.target.value = value;
  });
}

/**
 * Aplica máscara de telefone
 */
function applyPhoneMask(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 11);

    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
    }

    e.target.value = value;
  });
}

/**
 * Aplica máscara de cartão de crédito
 */
function applyCardMask(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    e.target.value = value;
  });
}

/**
 * Aplica máscara de validade do cartão
 */
function applyExpiryMask(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 4);

    if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,2}).*/, '$1/$2');
    }

    e.target.value = value;
  });
}

/**
 * Aplica máscara de CVV
 */
function applyCVVMask(input) {
  input.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 4);
    e.target.value = value;
  });
}

// ==================== VALIDAÇÃO DE FORMULÁRIOS ====================

/**
 * Valida formulário
 */
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;

      // Adicionar mensagem de erro se não existir
      if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('form-error')) {
        const error = document.createElement('div');
        error.className = 'form-error';
        error.textContent = 'Campo obrigatório';
        input.parentNode.insertBefore(error, input.nextSibling);
      }
    } else {
      input.classList.remove('error');

      // Remover mensagem de erro
      if (input.nextElementSibling && input.nextElementSibling.classList.contains('form-error')) {
        input.nextElementSibling.remove();
      }
    }

    // Validações específicas
    if (input.type === 'email' && input.value && !isValidEmail(input.value)) {
      input.classList.add('error');
      isValid = false;
    }

    if (input.dataset.cpf && input.value && !isValidCPF(input.value)) {
      input.classList.add('error');
      isValid = false;
    }
  });

  return isValid;
}

// ==================== SCROLL SUAVE ====================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ==================== ANIMAÇÕES CSS ====================

const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ==================== INICIALIZAÇÃO ====================

// Verificar autenticação ao carregar
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
});
