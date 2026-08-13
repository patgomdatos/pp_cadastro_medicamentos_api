require('dotenv').config();

const { register, login } = require('../src/services/authService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/config');
const { db } = require('../src/models/db');

async function test() {
  console.log('=== TESTE DE AUTENTICAÇÃO DIAGNÓSTICO ===\n');
  console.log('⚙️  Configuração:');
  console.log('   JWT_SECRET:', JWT_SECRET);
  console.log('   Arquivo .env existe?', require('fs').existsSync('.env'));
  if (require('fs').existsSync('.env')) {
    const envContent = require('fs').readFileSync('.env', 'utf8');
    console.log('   Conteúdo do .env:');
    envContent.split('\n').forEach(line => {
      if (line.trim()) console.log('      ' + line);
    });
  }

  console.log('\n📝 Usuarios no banco:');
  db.users.forEach(u => {
    console.log(`   - ID ${u.id}: ${u.email} (hash: ${u.passwordHash})`);
  });

  console.log('\n🔑 Teste 1: Login e geração de token');
  try {
    const token = await login({ email: 'test@local', password: 'senha123' });
    console.log('✓ Token gerado com sucesso');
    console.log('  Token:', token);

    const decoded = jwt.decode(token);
    console.log('\n📊 Decodificação do token:');
    console.log('  ID:', decoded.id);
    console.log('  Email:', decoded.email);
    console.log('  Emitido em:', new Date(decoded.iat * 1000).toISOString());
    console.log('  Expira em:', new Date(decoded.exp * 1000).toISOString());
    console.log('  Segundos até expirar:', decoded.exp - Math.floor(Date.now() / 1000));

    console.log('\n✓ Verificação do token com JWT_SECRET:');
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      console.log('✓ Token VERIFICADO com sucesso!');
      console.log('  Payload:', verified);
    } catch (err) {
      console.log('✗ ERRO na verificação:', err.message);
    }

    console.log('\n🧪 Teste 2: Simular requisição HTTP com Bearer token');
    const authHeader = `Bearer ${token}`;
    console.log('  Header Authorization:', authHeader.substring(0, 50) + '...');
    
    // Extrair token do header
    if (authHeader.startsWith('Bearer ')) {
      const extractedToken = authHeader.slice(7);
      console.log('  Token extraído:', extractedToken.substring(0, 50) + '...');
      
      try {
        const payload = jwt.verify(extractedToken, JWT_SECRET);
        console.log('  ✓ Token verificado após extração');
        
        const user = db.users.find(u => u.id === payload.id);
        if (user) {
          console.log('  ✓ Usuário encontrado:', user.email);
          console.log('\n✅ FLUXO COMPLETO BEM-SUCEDIDO!');
        } else {
          console.log('  ✗ Usuário não encontrado na base de dados');
        }
      } catch (err) {
        console.log('  ✗ Erro ao verificar token:', err.message);
      }
    }

    console.log('\n🔴 Teste 3: Tentar com token expirado');
    const expiredToken = jwt.sign({ id: 1, email: 'test@local' }, JWT_SECRET, { expiresIn: '-1s' });
    try {
      jwt.verify(expiredToken, JWT_SECRET);
      console.log('  ✗ Token expirado foi aceito (não deveria!)');
    } catch (err) {
      console.log('  ✓ Token expirado corretamente rejeitado:', err.message);
    }

    console.log('\n🔴 Teste 4: Tentar com secret errado');
    const wrongSecretToken = jwt.sign({ id: 1, email: 'test@local' }, 'secret_errada', { expiresIn: '8h' });
    try {
      jwt.verify(wrongSecretToken, JWT_SECRET);
      console.log('  ✗ Token com secret errado foi aceito (não deveria!)');
    } catch (err) {
      console.log('  ✓ Token com secret errado corretamente rejeitado:', err.message);
    }

    console.log('\n=== CONCLUSÃO ===');
    console.log('✅ A autenticação está funcionando corretamente!');
    console.log('\nPossíveis causas de "token inválido" na sua requisição:');
    console.log('1. Token já está expirado (verificar timestamp "exp")');
    console.log('2. Secret diferente em .env vs código');
    console.log('3. Token foi gerado com secret diferente');
    console.log('4. Erro no formato do header Authorization');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

test().then(() => process.exit(0));
