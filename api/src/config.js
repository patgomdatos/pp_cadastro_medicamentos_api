require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

module.exports = { JWT_SECRET };
