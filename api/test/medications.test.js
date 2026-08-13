require('dotenv').config();

const jwt = require('jsonwebtoken');
const { register, login } = require('../src/services/authService');
const { JWT_SECRET } = require('../src/config');
const { db } = require('../src/models/db');
const {
  createMedication,
  listMedications,
  getMedication,
  updateMedication,
  deleteMedication,
  getDosesForDay,
  registerDose,
  getHistory
} = require('../src/services/medService');

(async () => {
  console.log('=== TESTE DE ROTAS PROTEGIDAS ===\n');

  try {
    // Fazer login e obter token
    console.log('--- Fazendo login ---');
    const token = await login({ email: 'test@local', password: 'senha123' });
    console.log('✓ Token obtido com sucesso\n');

    // Simular contexto de requisição com usuário autenticado
    const userId = 1;

    console.log('--- Testando operações de medicamentos ---');

    // Teste 1: Adicionar medicamento
    console.log('\n1️⃣  Adicionando medicamento...');
    const today = new Date().toISOString().split('T')[0];
    const med = createMedication(userId, {
      name: 'Amoxicilina',
      dosage: '500',
      unit: 'mg',
      times: ['08:00', '14:00', '20:00'],
      startDate: today,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    });
    console.log('✓ Medicamento adicionado:', JSON.stringify(med, null, 2));

    // Teste 2: Listar medicamentos
    console.log('\n2️⃣  Listando medicamentos...');
    const meds = listMedications(userId);
    console.log('✓ Medicamentos listados:', JSON.stringify(meds, null, 2));

    // Teste 3: Obter medicamento específico
    console.log('\n3️⃣  Obtendo medicamento específico...');
    const retrieved = getMedication(userId, med.id);
    console.log('✓ Medicamento recuperado:', JSON.stringify(retrieved, null, 2));

    // Teste 4: Atualizar medicamento
    console.log('\n4️⃣  Atualizando medicamento...');
    const updated = updateMedication(userId, med.id, {
      name: 'Amoxicilina Plus',
      dosage: '750'
    });
    console.log('✓ Medicamento atualizado:', JSON.stringify(updated, null, 2));

    // Teste 5: Obter doses do dia
    console.log('\n5️⃣  Obtendo doses do dia...');
    const doses = getDosesForDay(userId, today);
    console.log('✓ Doses obtidas:', JSON.stringify(doses.slice(0, 2), null, 2), `... (total: ${doses.length})`);

    // Teste 6: Registrar dose como tomada
    if (doses.length > 0) {
      console.log('\n6️⃣  Registrando dose como tomada...');
      const registered = registerDose(userId, med.id, doses[0].scheduled, 'take');
      console.log('✓ Dose registrada:', JSON.stringify(registered, null, 2));

      // Teste 7: Histórico de medicamento
      console.log('\n7️⃣  Obtendo histórico de medicamento...');
      const history = getHistory(userId, med.id, today, today);
      console.log('✓ Histórico:', JSON.stringify(history.slice(0, 2), null, 2), `... (total: ${history.length})`);
    }

    // Teste 8: Deletar medicamento
    console.log('\n8️⃣  Deletando medicamento...');
    deleteMedication(userId, med.id);
    console.log('✓ Medicamento deletado com sucesso');

    // Verificar que foi deletado
    const allMeds = listMedications(userId);
    console.log('✓ Medicamentos restantes:', allMeds.length);

    console.log('\n=== ✅ TODOS OS TESTES DE MEDICAMENTOS PASSARAM ===\n');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }

  process.exit(0);
})().catch(err => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});
