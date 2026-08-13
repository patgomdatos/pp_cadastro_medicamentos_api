const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const medRoutes = require('./medications');

router.use('/auth', authRoutes);
router.use('/', medRoutes); // medications, doses, etc.

module.exports = router;
