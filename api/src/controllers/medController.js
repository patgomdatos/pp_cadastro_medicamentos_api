const medService = require('../services/medService');

async function createMedication(req, res) {
  try {
    const med = await medService.createMedication(req.user.id, req.body);
    res.status(201).json(med);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function listMedications(req, res) {
  const meds = medService.listMedications(req.user.id);
  res.json(meds);
}

async function getMedication(req, res) {
  try {
    const med = medService.getMedication(req.user.id, Number(req.params.id));
    res.json(med);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
}

async function updateMedication(req, res) {
  try {
    const med = medService.updateMedication(req.user.id, Number(req.params.id), req.body);
    res.json(med);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function deleteMedication(req, res) {
  try {
    medService.deleteMedication(req.user.id, Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function getDosesForDay(req, res) {
  try {
    const date = req.query.date; // YYYY-MM-DD
    const doses = medService.getDosesForDay(req.user.id, date);
    res.json(doses);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function registerDose(req, res) {
  try {
    const medId = Number(req.params.id);
    const { scheduled, action } = req.body; // scheduled: ISO datetime string, action: 'take'|'unmark'
    if (!scheduled || !action) throw new Error('scheduled and action are required');
    const dose = medService.registerDose(req.user.id, medId, scheduled, action);
    res.json(dose);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function getHistory(req, res) {
  try {
    const medId = Number(req.params.id);
    const { from, to } = req.query; // optional YYYY-MM-DD
    const history = medService.getHistory(req.user.id, medId, from, to);
    res.json(history);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = {
  createMedication,
  listMedications,
  getMedication,
  updateMedication,
  deleteMedication,
  getDosesForDay,
  registerDose,
  getHistory
};
