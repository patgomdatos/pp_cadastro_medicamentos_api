const jwt = require('jsonwebtoken');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBhZG1pbi5jb20iLCJpYXQiOjE3ODY1Nzg3MTcsImV4cCI6MTc4NjYwNzUxN30.8BsAkE8nUpKEQaCZHBZxrDHDndMFRWyTncu3yYbXeeY';
const secret = process.env.JWT_SECRET || 'change_this_secret';
console.log('Using secret:', secret);
console.log('Decoded (no verify):', jwt.decode(token));
try {
  const payload = jwt.verify(token, secret);
  console.log('Verified payload:', payload);
} catch (e) {
  console.error('Verify error:', e.message);
}
