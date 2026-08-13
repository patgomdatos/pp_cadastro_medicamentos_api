require('dotenv').config();

const jwt = require('jsonwebtoken');
const { login } = require('../src/services/authService');
const { JWT_SECRET } = require('../src/config');

(async () => {
  console.log('=== GERAR TOKEN VÁLIDO PARA SWAGGER ===\n');

  try {
    // Gerar um token novo
    const token = await login({ email: 'test@local', password: 'senha123' });
    
    console.log('✅ TOKEN GERADO COM SUCESSO:\n');
    console.log('━'.repeat(70));
    console.log(token);
    console.log('━'.repeat(70));
    
    // Analisar o token
    const decoded = jwt.decode(token);
    console.log('\n📊 INFORMAÇÕES DO TOKEN:');
    console.log('   ID:', decoded.id);
    console.log('   Email:', decoded.email);
    console.log('   Emitido em:', new Date(decoded.iat * 1000).toLocaleString('pt-BR'));
    console.log('   Expira em:', new Date(decoded.exp * 1000).toLocaleString('pt-BR'));
    
    const agora = Math.floor(Date.now() / 1000);
    const segundosRestantes = decoded.exp - agora;
    console.log('   Tempo restante:', Math.floor(segundosRestantes / 3600) + 'h ' + Math.floor((segundosRestantes % 3600) / 60) + 'min');

    // Verificar integridade
    console.log('\n🔐 VERIFICAÇÃO DE INTEGRIDADE:');
    try {
      jwt.verify(token, JWT_SECRET);
      console.log('   ✓ Token é VÁLIDO para usar na API');
    } catch (err) {
      console.log('   ✗ Erro:', err.message);
    }

    console.log('\n📋 COMO USAR NO SWAGGER:');
    console.log('   1. Clique em "Authorize" no Swagger UI');
    console.log('   2. Cole o token INTEIRO (sem "Bearer", o Swagger adiciona automaticamente)');
    console.log('   3. Clique em "Authorize"');
    console.log('   4. Clique em "Close"');
    console.log('   5. Teste uma requisição protegida\n');

    console.log('🧪 TESTAR MANUALMENTE COM CURL:');
    console.log(`\ncurl -X GET "http://localhost:3000/medications" \\`);
    console.log(`  -H "Authorization: Bearer ${token}"`);

  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }

  process.exit(0);
})().catch(err => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});
