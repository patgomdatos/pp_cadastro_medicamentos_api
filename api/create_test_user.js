require('dotenv').config();

const { register, login } = require('./src/services/authService');
const fs = require('fs');

(async () => {
  try {
    const email = 'test@local';
    const password = 'senha123';
    const user = await register({ email, password });
    const token = await login({ email, password });
    const out = `Created user: ${JSON.stringify(user)}\nToken: ${token}\n`;
    fs.writeFileSync('test_token.txt', out, 'utf8');
    console.log('Wrote test_token.txt');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
