const express = require('express');
const router = express.Router();
const medController = require('../controllers/medController');
const { authMiddleware } = require('../middleware/auth');

// Medication CRUD
router.post('/medications', authMiddleware, medController.createMedication);
router.get('/medications', authMiddleware, medController.listMedications);
router.get('/medications/:id', authMiddleware, medController.getMedication);
router.put('/medications/:id', authMiddleware, medController.updateMedication);
router.delete('/medications/:id', authMiddleware, medController.deleteMedication);

// Doses: scheduled for a day
router.get('/doses', authMiddleware, medController.getDosesForDay);
// register a taken dose or unmark
router.post('/medications/:id/doses', authMiddleware, medController.registerDose);
// history
router.get('/medications/:id/history', authMiddleware, medController.getHistory);

module.exports = router;
