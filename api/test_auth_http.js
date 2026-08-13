require('dotenv').config();

const http = require('http');
const { JWT_SECRET } = require('./src/config');

// Iniciar servidor
const app = require('./src/server');

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log('✓ Servidor iniciado na porta', PORT);
  runTests();
});

async function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n=== TESTE DE AUTENTICAÇÃO VIA HTTP ===\n');
  console.log('JWT_SECRET no servidor:', JWT_SECRET);
  console.log('Ambiente NODE_ENV:', process.env.NODE_ENV);

  try {
    // Teste 1: Login
    console.log('\n--- TESTE 1: Login ---');
    const loginRes = await makeRequest('POST', '/auth/login', {}, {
      email: 'test@local',
      password: 'senha123'
    });
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginRes.body, null, 2));

    if (loginRes.status !== 200) {
      console.log('✗ Login falhou');
      server.close();
      process.exit(1);
    }

    const token = loginRes.body.token;
    console.log('✓ Token recebido:', token.substring(0, 50) + '...');

    // Teste 2: Requisição com token válido
    console.log('\n--- TESTE 2: Requisição com token válido ---');
    const validRes = await makeRequest('GET', '/medications', {
      'Authorization': `Bearer ${token}`
    });
    console.log('Status:', validRes.status);
    console.log('Response:', JSON.stringify(validRes.body, null, 2));

    if (validRes.status === 200) {
      console.log('✓ Requisição com token válido bem-sucedida');
    } else {
      console.log('✗ Falha com token válido - Este é o problema!');
    }

    // Teste 3: Requisição sem token
    console.log('\n--- TESTE 3: Requisição sem token (deve falhar) ---');
    const noTokenRes = await makeRequest('GET', '/medications');
    console.log('Status:', noTokenRes.status);
    console.log('Response:', JSON.stringify(noTokenRes.body, null, 2));
    
    if (noTokenRes.status === 401) {
      console.log('✓ Corretamente rejeitada sem token');
    }

    // Teste 4: Requisição com token inválido
    console.log('\n--- TESTE 4: Requisição com token inválido ---');
    const invalidTokenRes = await makeRequest('GET', '/medications', {
      'Authorization': 'Bearer invalid.token.here'
    });
    console.log('Status:', invalidTokenRes.status);
    console.log('Response:', JSON.stringify(invalidTokenRes.body, null, 2));

    if (invalidTokenRes.status === 401) {
      console.log('✓ Corretamente rejeitada com token inválido');
    }

    // Teste 5: Requisição com token mas secret errado
    console.log('\n--- TESTE 5: Token gerado com secret errado ---');
    const jwt = require('jsonwebtoken');
    const wrongSecretToken = jwt.sign({ id: 1, email: 'test@local' }, 'wrong_secret', { expiresIn: '8h' });
    const wrongSecretRes = await makeRequest('GET', '/medications', {
      'Authorization': `Bearer ${wrongSecretToken}`
    });
    console.log('Status:', wrongSecretRes.status);
    console.log('Response:', JSON.stringify(wrongSecretRes.body, null, 2));

    if (wrongSecretRes.status === 401) {
      console.log('✓ Corretamente rejeitada com secret errado');
    } else {
      console.log('✗ Token com secret errado foi aceito - PROBLEMA!');
    }

    console.log('\n=== RESUMO DO TESTE ===');
    console.log('✓ Todos os testes de autenticação HTTP foram executados');
    console.log('Verifique os resultados acima para identificar o problema');

  } catch (err) {
    console.error('Erro durante testes:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
}
