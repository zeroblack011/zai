// ========================================
// HTMLS EMBUTIDOS - SERVIR VIA WORKER
// ========================================

// Importar HTMLs como strings (em produção, usar bundler)
// Por ora, vamos criar um sistema que lê do KV ou serve inline

export const HTML_FILES = {
  'index.html': null,  // Será carregado do KV ou filesystem
  'servico.html': null,
  'creditos.html': null,
  'checkout.html': null,
  'login.html': null,
  'registro.html': null,
  'painel-cliente.html': null,
  'painel-admin.html': null,
};

export const CSS_FILES = {
  'css/style.css': null,
};

export const JS_FILES = {
  'js/main.js': null,
};

/**
 * Serve arquivo estático do KV ou retorna inline
 */
export async function serveStaticFile(filename, kv) {
  // Tentar do KV primeiro
  const cached = await kv.get(`static:${filename}`, 'text');
  if (cached) {
    const contentType = getContentType(filename);
    return new Response(cached, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Se não encontrar, retornar 404
  return new Response('File not found', { status: 404 });
}

/**
 * Determina Content-Type baseado na extensão
 */
function getContentType(filename) {
  if (filename.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filename.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filename.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filename.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.svg')) return 'image/svg+xml';
  if (filename.endsWith('.ico')) return 'image/x-icon';
  return 'text/plain';
}

/**
 * Upload de arquivos estáticos para o KV (usar em setup)
 */
export async function uploadStaticFiles(kv, filesMap) {
  for (const [filename, content] of Object.entries(filesMap)) {
    await kv.put(`static:${filename}`, content);
  }
}
