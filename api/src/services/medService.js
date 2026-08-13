const { db, nextId } = require('../models/db');
const { isValidDate, parseISODate } = require('./utils');

function createMedication(userId, payload) {
  const { name, dosage, unit, times, startDate, daysOfWeek } = payload;
  if (!name || !dosage || !unit || !Array.isArray(times) || times.length === 0 || !startDate) {
    throw new Error('Invalid medication data');
  }
  const med = {
    id: nextId('med'),
    userId,
    name,
    dosage,
    unit,
    times, // array of HH:mm
    startDate, // YYYY-MM-DD
    daysOfWeek: Array.isArray(daysOfWeek) ? daysOfWeek : [0,1,2,3,4,5,6]
  };
  db.medications.push(med);
  return med;
}

function listMedications(userId) {
  return db.medications.filter(m => m.userId === userId);
}

function getMedication(userId, medId) {
  const med = db.medications.find(m => m.id === medId && m.userId === userId);
  if (!med) throw new Error('Medication not found');
  return med;
}

function updateMedication(userId, medId, payload) {
  const med = db.medications.find(m => m.id === medId && m.userId === userId);
  if (!med) throw new Error('Medication not found');
  const keys = ['name','dosage','unit','times','startDate','daysOfWeek'];
  keys.forEach(k => { if (payload[k] !== undefined) med[k] = payload[k]; });
  return med;
}

function deleteMedication(userId, medId) {
  const idx = db.medications.findIndex(m => m.id === medId && m.userId === userId);
  if (idx === -1) throw new Error('Medication not found');
  db.medications.splice(idx,1);
  // also remove doses
  db.doses = db.doses.filter(d => d.medId !== medId);
}

// return scheduled doses for a date (YYYY-MM-DD)
function getDosesForDay(userId, date) {
  if (!isValidDate(date)) throw new Error('Invalid date');
  const target = new Date(date + 'T00:00:00');
  const day = target.getDay(); // 0-6
  const meds = db.medications.filter(m => m.userId === userId && new Date(m.startDate) <= target && m.daysOfWeek.includes(day));
  const scheduled = [];
  meds.forEach(m => {
    m.times.forEach(t => {
      const iso = `${date}T${t}:00`;
      // find existing dose record
      let dose = db.doses.find(d => d.medId === m.id && d.scheduled === iso);
      if (!dose) {
        dose = { id: nextId('dose'), medId: m.id, userId, scheduled: iso, status: 'pending', takenAt: null };
        db.doses.push(dose);
      }
      scheduled.push({ ...dose, medication: { id: m.id, name: m.name, dosage: m.dosage, unit: m.unit, time: t } });
    });
  });
  // sort by scheduled
  scheduled.sort((a,b) => a.scheduled.localeCompare(b.scheduled));
  return scheduled;
}

function registerDose(userId, medId, scheduledIso, action) {
  const med = db.medications.find(m => m.id === medId);
  if (!med) throw new Error('Medication not found');
  if (med.userId !== userId) throw new Error('Medication belongs to another user');
  // ensure scheduled time belongs to med times
  // find or create dose
  let dose = db.doses.find(d => d.medId === medId && d.scheduled === scheduledIso);
  if (!dose) {
    dose = { id: nextId('dose'), medId, userId, scheduled: scheduledIso, status: 'pending', takenAt: null };
    db.doses.push(dose);
  }
  if (action === 'take') {
    dose.status = 'taken';
    dose.takenAt = new Date().toISOString();
  } else if (action === 'unmark') {
    dose.status = 'pending';
    dose.takenAt = null;
  } else {
    throw new Error('Invalid action');
  }
  return dose;
}

function getHistory(userId, medId, from, to) {
  const med = db.medications.find(m => m.id === medId && m.userId === userId);
  if (!med) throw new Error('Medication not found');
  let q = db.doses.filter(d => d.medId === medId && d.userId === userId);
  if (from && isValidDate(from)) q = q.filter(d => d.scheduled >= `${from}T00:00:00`);
  if (to && isValidDate(to)) q = q.filter(d => d.scheduled <= `${to}T23:59:59`);
  q.sort((a,b) => a.scheduled.localeCompare(b.scheduled));
  return q;
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
