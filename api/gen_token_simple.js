require('dotenv').config();

const jwt = require('jsonwebtoken');
const fs = require('fs');
const { JWT_SECRET } = require('./src/config');
const token = jwt.sign({ id: 1, email: 'test@local' }, JWT_SECRET, { expiresIn: '8h' });
fs.writeFileSync('test_token2.txt', token, 'utf8');
console.log('Wrote test_token2.txt');
