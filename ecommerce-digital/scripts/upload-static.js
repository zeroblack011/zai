#!/usr/bin/env node

/**
 * Script para fazer upload dos arquivos estáticos para o Cloudflare KV
 *
 * Uso:
 *   node scripts/upload-static.js
 *
 * Nota: Requer que você tenha configurado o wrangler e o KV namespace
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const FILES_TO_UPLOAD = [
  'public/index.html',
  'public/servico.html',
  'public/creditos.html',
  'public/checkout.html',
  'public/login.html',
  'public/registro.html',
  'public/painel-cliente.html',
  'public/painel-admin.html',
  'public/css/style.css',
  'public/js/main.js',
];

async function uploadFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const key = filePath.replace('public/', '');
    const kvKey = `static:${key}`;

    // Escapar aspas no conteúdo
    const escapedContent = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    // Usar wrangler para fazer upload
    const command = `wrangler kv:key put --binding=ECOMMERCE_DB "${kvKey}" "${escapedContent}"`;

    console.log(`Uploading ${key}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✓ ${key} uploaded successfully`);

  } catch (error) {
    console.error(`✗ Error uploading ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Uploading static files to Cloudflare KV...\n');

  for (const file of FILES_TO_UPLOAD) {
    await uploadFile(file);
  }

  console.log('\n✅ All files uploaded successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Deploy your worker: npm run deploy');
  console.log('   2. Access your site!');
}

main().catch(console.error);
