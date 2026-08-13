#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║         SUITE DE TESTES AUTOMATIZADOS - API MEDICAMENTOS      ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const tests = [
  {
    name: 'Teste de Autenticação Completo',
    file: 'auth.test.js',
    description: 'Valida o fluxo completo de geração e verificação de tokens'
  },
  {
    name: 'Teste Diagnóstico de Autenticação',
    file: 'auth.diagnostic.js',
    description: 'Diagnostica possíveis problemas com tokens inválidos'
  },
  {
    name: 'Teste de Medicamentos',
    file: 'medications.test.js',
    description: 'Testa operações CRUD de medicamentos com autenticação'
  }
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  console.log(`\n${'═'.repeat(65)}`);
  console.log(`[${index + 1}/${tests.length}] ${test.name}`);
  console.log(`${'─'.repeat(65)}`);
  console.log(`📝 ${test.description}\n`);

  try {
    const testPath = path.join(__dirname, test.file);
    execSync(`node ${testPath}`, { stdio: 'inherit', cwd: __dirname });
    passed++;
    console.log(`\n✅ ${test.name} - PASSOU`);
  } catch (err) {
    failed++;
    console.log(`\n❌ ${test.name} - FALHOU`);
  }
});

console.log(`\n${'═'.repeat(65)}`);
console.log('📊 RESUMO DOS TESTES');
console.log(`${'─'.repeat(65)}`);
console.log(`✅ Passou: ${passed}/${tests.length}`);
console.log(`❌ Falhou: ${failed}/${tests.length}`);

if (failed === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} teste(s) falharam\n`);
  process.exit(1);
}
