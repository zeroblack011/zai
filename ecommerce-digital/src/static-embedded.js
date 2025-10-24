// ========================================
// HTMLS EMBUTIDOS - NÃO DEPENDE DE KV
// ========================================

/**
 * Serve arquivo estático embutido
 */
export async function serveStaticFile(filename, kv) {
  // Primeiro tentar do KV (se tiver)
  try {
    const cached = await kv.get(`static:${filename}`, 'text');
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': getContentType(filename),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch (e) {
    console.log('KV read error:', e);
  }

  // Se não encontrou no KV, usar versão embutida
  const content = getEmbeddedFile(filename);

  if (content) {
    return new Response(content, {
      headers: {
        'Content-Type': getContentType(filename),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Se ainda não encontrou, 404
  return new Response('File not found', { status: 404 });
}

/**
 * Retorna arquivo embutido
 */
function getEmbeddedFile(filename) {
  const files = {
    'index.html': INDEX_HTML,
    'servico.html': SERVICO_HTML,
    'creditos.html': CREDITOS_HTML,
    'checkout.html': CHECKOUT_HTML,
    'login.html': LOGIN_HTML,
    'registro.html': REGISTRO_HTML,
    'painel-cliente.html': PAINEL_CLIENTE_HTML,
    'painel-admin.html': PAINEL_ADMIN_HTML,
    'css/style.css': STYLE_CSS,
    'js/main.js': MAIN_JS,
  };

  return files[filename] || null;
}

/**
 * Determina Content-Type
 */
function getContentType(filename) {
  if (filename.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filename.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filename.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filename.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'text/plain';
}

// ========================================
// ARQUIVOS EMBUTIDOS (MINIFICADOS)
// ========================================

const INDEX_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>E-commerce Digital - Serviços Digitais</title>
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<header class="header">
<div class="container"><div class="header-content">
<a href="/" class="logo"><span>💼</span><span>Digital Services</span></a>
<nav class="nav" id="mainNav">
<a href="/" class="nav-link active">Serviços</a>
<a href="/creditos.html" class="nav-link">Créditos</a>
<a href="/painel-cliente.html" class="nav-link">Meus Pedidos</a>
<a href="/login.html" class="nav-link btn btn-primary btn-sm" id="authButton">Login</a>
</nav>
</div></div>
</header>
<section class="hero">
<div class="container">
<h1 class="hero-title">Serviços Digitais que Transformam Negócios</h1>
<p class="hero-subtitle">LLC nos EUA, TikTok Shop, Business Managers verificados e muito mais.</p>
<div class="hero-cta">
<a href="#servicos" class="btn btn-lg btn-accent">Ver Todos os Serviços</a>
<a href="/creditos.html" class="btn btn-lg btn-outline">Comprar Créditos</a>
</div>
</div>
</section>
<section id="servicos" style="padding: 60px 0;">
<div class="container">
<div style="text-align: center; margin-bottom: 48px;">
<h2 style="font-size: 36px; font-weight: 800;">Nossos Serviços</h2>
</div>
<div class="services-grid" id="servicesGrid">
<div style="grid-column: 1/-1; text-align: center; padding: 40px;">
<div class="loading loading-lg"></div>
<p style="margin-top: 16px;">Carregando serviços...</p>
</div>
</div>
</div>
</section>
<script src="/js/main.js"></script>
<script>
async function loadServices() {
  try {
    const res = await fetch('/api/services');
    const data = await res.json();
    const grid = document.getElementById('servicesGrid');
    grid.innerHTML = data.services.map(s => \`
      <div class="card service-card">
        \${s.popular ? '<div class="service-badge">POPULAR</div>' : ''}
        <div class="service-icon">\${s.image}</div>
        <h3 class="card-title">\${s.name}</h3>
        <div class="service-price">R$ \${s.price.toFixed(2).replace('.', ',')}</div>
        <p style="color: var(--text-light);">\${s.description}</p>
        <a href="/servico.html?id=\${s.id}" class="btn btn-primary btn-block">Ver Detalhes</a>
      </div>
    \`).join('');
  } catch(e) {
    document.getElementById('servicesGrid').innerHTML = '<p>Erro ao carregar</p>';
  }
}
loadServices();
checkAuth();
</script>
</body>
</html>`;

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login - E-commerce Digital</title>
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<section style="padding: 80px 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
<div class="card" style="max-width: 500px; width: 100%;">
<div style="text-align: center; margin-bottom: 32px;">
<h1 style="font-size: 32px; margin-bottom: 8px;">Login</h1>
<p style="color: var(--text-light);">Entre com sua conta</p>
</div>
<div id="alertContainer"></div>
<form id="loginForm">
<div class="form-group">
<label class="form-label">Email</label>
<input type="email" class="form-input" id="email" required>
</div>
<div class="form-group">
<label class="form-label">Senha</label>
<input type="password" class="form-input" id="password" required>
</div>
<button type="submit" class="btn btn-primary btn-lg btn-block">Entrar</button>
<div style="text-align: center; margin-top: 24px;">
<p>Não tem conta? <a href="/registro.html" style="color: var(--primary);">Criar conta</a></p>
</div>
</form>
</div>
</section>
<script src="/js/main.js"></script>
<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const result = await login(email, password);
  if (result.success) {
    window.location.href = '/painel-cliente.html';
  } else {
    document.getElementById('alertContainer').innerHTML = '<div class="alert alert-error">'+result.error+'</div>';
  }
});
</script>
</body>
</html>`;

const REGISTRO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Criar Conta</title>
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<section style="padding: 80px 20px;">
<div class="card" style="max-width: 600px; margin: 0 auto;">
<h1 style="text-align: center; margin-bottom: 32px;">Criar Conta</h1>
<div id="alertContainer"></div>
<form id="registerForm">
<div class="form-group">
<label class="form-label">Nome</label>
<input type="text" class="form-input" id="name" required>
</div>
<div class="form-group">
<label class="form-label">Email</label>
<input type="email" class="form-input" id="email" required>
</div>
<div class="form-group">
<label class="form-label">CPF</label>
<input type="text" class="form-input" id="cpf" required maxlength="14">
</div>
<div class="form-group">
<label class="form-label">Telefone</label>
<input type="tel" class="form-input" id="phone">
</div>
<div class="form-group">
<label class="form-label">Senha</label>
<input type="password" class="form-input" id="password" required>
</div>
<button type="submit" class="btn btn-primary btn-lg btn-block">Criar Conta</button>
<div style="text-align: center; margin-top: 16px;">
<a href="/login.html">Já tenho conta</a>
</div>
</form>
</div>
</section>
<script src="/js/main.js"></script>
<script>
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const result = await register({
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    cpf: document.getElementById('cpf').value.replace(/\\D/g, ''),
    phone: document.getElementById('phone').value,
    password: document.getElementById('password').value
  });
  if (result.success) {
    window.location.href = '/painel-cliente.html';
  } else {
    document.getElementById('alertContainer').innerHTML = '<div class="alert alert-error">'+result.error+'</div>';
  }
});
</script>
</body>
</html>`;

// Placeholders para outros arquivos
const SERVICO_HTML = '<html><body><h1>Serviço</h1><p>Em desenvolvimento</p></body></html>';
const CREDITOS_HTML = '<html><body><h1>Créditos</h1><p>Em desenvolvimento</p></body></html>';
const CHECKOUT_HTML = '<html><body><h1>Checkout</h1><p>Em desenvolvimento</p></body></html>';
const PAINEL_CLIENTE_HTML = '<html><body><h1>Painel Cliente</h1><p>Em desenvolvimento</p></body></html>';
const PAINEL_ADMIN_HTML = '<html><body><h1>Painel Admin</h1><p>Em desenvolvimento</p></body></html>';

const STYLE_CSS = ':root{--primary:#2563eb;--secondary:#059669;--accent:#dc2626;--text-light:#6b7280;--bg-light:#f9fafb}*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;color:#111827;background:#f9fafb}.container{max-width:1200px;margin:0 auto;padding:0 20px}.header{background:#fff;box-shadow:0 1px 2px rgba(0,0,0,0.05);position:sticky;top:0;z-index:1000}.header-content{display:flex;justify-content:space-between;align-items:center;padding:16px 0}.logo{font-size:24px;font-weight:700;color:var(--primary);text-decoration:none;display:flex;align-items:center;gap:8px}.nav{display:flex;gap:24px;align-items:center}.nav-link{color:#111;text-decoration:none;padding:8px 12px;border-radius:8px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;font-size:16px;font-weight:600;border:none;border-radius:8px;cursor:pointer;text-decoration:none}.btn-primary{background:var(--primary);color:#fff}.btn-accent{background:var(--accent);color:#fff}.btn-outline{background:transparent;color:var(--primary);border:2px solid var(--primary)}.btn-block{width:100%}.btn-lg{padding:16px 32px;font-size:18px}.btn-sm{padding:8px 16px;font-size:14px}.hero{background:linear-gradient(135deg,var(--primary),#1e40af);color:#fff;padding:80px 0;text-align:center}.hero-title{font-size:48px;font-weight:800;margin-bottom:16px}.hero-subtitle{font-size:20px;margin-bottom:32px;opacity:0.9}.hero-cta{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}.card{background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);padding:24px;border:1px solid #e5e7eb}.card-title{font-size:20px;font-weight:700;margin-bottom:8px}.services-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px;margin:40px 0}.service-card{position:relative}.service-icon{font-size:48px;margin-bottom:16px}.service-badge{position:absolute;top:16px;right:16px;background:var(--accent);color:#fff;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600}.service-price{font-size:32px;font-weight:800;color:var(--primary);margin:16px 0}.form-group{margin-bottom:20px}.form-label{display:block;margin-bottom:8px;font-weight:600}.form-input,.form-select{width:100%;padding:12px 16px;font-size:16px;border:2px solid #e5e7eb;border-radius:8px}.alert{padding:16px;border-radius:8px;margin-bottom:20px}.alert-error{background:#fee2e2;color:#991b1b;border:1px solid #dc2626}.loading{display:inline-block;width:20px;height:20px;border:3px solid rgba(37,99,235,0.3);border-radius:50%;border-top-color:#2563eb;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.loading-lg{width:48px;height:48px;border-width:4px}';

const MAIN_JS = 'const API_URL=window.location.origin;const AppState={user:null,token:null};async function checkAuth(){const token=localStorage.getItem("authToken");if(!token)return false;try{const res=await fetch(API_URL+"/api/auth/me",{headers:{Authorization:"Bearer "+token}});if(res.ok){const data=await res.json();AppState.user=data.customer;AppState.token=token;return true}else{logout();return false}}catch(e){return false}}async function login(email,password){try{const res=await fetch(API_URL+"/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const data=await res.json();if(res.ok){localStorage.setItem("authToken",data.token);AppState.user=data.customer;AppState.token=data.token;return{success:true,user:data.customer}}else{return{success:false,error:data.error||"Erro ao fazer login"}}}catch(e){return{success:false,error:"Erro de conexão"}}}async function register(userData){try{const res=await fetch(API_URL+"/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(userData)});const data=await res.json();if(res.ok){localStorage.setItem("authToken",data.token);AppState.user=data.customer;AppState.token=data.token;return{success:true,user:data.customer}}else{return{success:false,error:data.error||"Erro ao criar conta"}}}catch(e){return{success:false,error:"Erro de conexão"}}}function logout(){localStorage.removeItem("authToken");AppState.user=null;AppState.token=null;window.location.href="/login.html"}async function requireAuth(){const isAuth=await checkAuth();if(!isAuth){window.location.href="/login.html";return false}return true}';
