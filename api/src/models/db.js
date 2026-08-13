const db = {
  users: [
    // usuário de teste (presente para facilitar testes locais)
    { id: 1, email: 'test@local', passwordHash: 'placeholder' }
  ],
  medications: [],
  doses: [],
  _counters: {
    userId: 2,
    medId: 1,
    doseId: 1
  }
};

function nextId(kind) {
  const key = { user: 'userId', med: 'medId', dose: 'doseId' }[kind];
  return db._counters[key]++;
}

module.exports = { db, nextId };
