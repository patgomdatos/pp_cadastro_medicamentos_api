const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, nextId } = require('../models/db');
const { JWT_SECRET } = require('../config');

async function register({ email, password }) {
  if (!email || !password) throw new Error('Email and password are required');
  const exists = db.users.find(u => u.email === email.toLowerCase());
  if (exists) throw new Error('User already exists');
  const hash = await bcrypt.hash(password, 8);
  const user = { id: nextId('user'), email: email.toLowerCase(), passwordHash: hash };
  db.users.push(user);

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  return { ...user, token };
}

async function login({ email, password }) {
  if (!email || !password) throw new Error('Invalid credentials');
  const user = db.users.find(u => u.email === email.toLowerCase());
  if (!user) throw new Error('Invalid credentials');
  // For local testing: allow the placeholder user with plain password 'senha123'
  if (user.passwordHash === 'placeholder') {
    if (password !== 'senha123') throw new Error('Invalid credentials');
  } else {
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error('Invalid credentials');
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  return token;
}

module.exports = { register, login };
