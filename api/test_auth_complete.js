require('dotenv').config();

const jwt = require('jsonwebtoken');
const { register, login } = require('./src/services/authService');
const { JWT_SECRET } = require('./src/config');
const { db } = require('./src/models/db');

(async () => {
  console.log('=== TESTE DE AUTENTICAÇÃO COMPLETO ===\n');
  console.log('JWT_SECRET:', JWT_SECRET);
  console.log('Variável de ambiente JWT_SECRET:', process.env.JWT_SECRET);
  console.log('\n--- FASE 1: Criar/Verificar Usuário ---');

  try {
    // Verificar se usuário de teste já existe
    const existingUser = db.users.find(u => u.email === 'test@local');
    console.log('Usuário de teste exists:', !!existingUser);
    if (existingUser) {
      console.log('Usuário existente:', JSON.stringify(existingUser, null, 2));
    }

    console.log('\n--- FASE 2: Fazer Login ---');
    const token = await login({ email: 'test@local', password: 'senha123' });
    console.log('✓ Token gerado com sucesso');
    console.log('Token:', token);

    console.log('\n--- FASE 3: Decodificar Token (sem verificar) ---');
    const decoded = jwt.decode(token);
    console.log('Payload decodificado:', JSON.stringify(decoded, null, 2));

    console.log('\n--- FASE 4: Verificar Token ---');
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      console.log('✓ Token verificado com sucesso!');
      console.log('Payload verificado:', JSON.stringify(verified, null, 2));

      // Simular o middleware de autenticação
      console.log('\n--- FASE 5: Simular Middleware de Autenticação ---');
      const user = db.users.find(u => u.id === verified.id);
      if (!user) {
        console.log('✗ Usuário não encontrado no banco de dados');
      } else {
        console.log('✓ Usuário encontrado no banco de dados');
        console.log('Usuário:', JSON.stringify(user, null, 2));
        console.log('\n✓ AUTENTICAÇÃO COMPLETA BEM-SUCEDIDA!');
      }
    } catch (verifyErr) {
      console.log('✗ ERRO ao verificar token:', verifyErr.message);
      console.log('\nDEBUGGING:');
      console.log('  - Secret usado na verificação:', JWT_SECRET);
      console.log('  - Timestamp exp do token:', decoded.exp);
      console.log('  - Timestamp atual:', Math.floor(Date.now() / 1000));
      console.log('  - Token expirado?', Math.floor(Date.now() / 1000) > decoded.exp);
    }
  } catch (err) {
    console.log('✗ ERRO:', err.message);
    process.exit(1);
  }

  console.log('\n--- FASE 6: Testar com Token Inválido ---');
  const invalidToken = jwt.sign({ id: 999, email: 'fake@test' }, 'wrong_secret', { expiresIn: '8h' });
  console.log('Token com secret errado:', invalidToken);
  try {
    jwt.verify(invalidToken, JWT_SECRET);
    console.log('✓ Token verificado (não deveria!)');
  } catch (err) {
    console.log('✗ Token rejeitado (esperado):', err.message);
  }

  console.log('\n=== FIM DO TESTE ===\n');
  process.exit(0);
})().catch(err => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});
