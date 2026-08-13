require('dotenv').config();

const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/server');
const { db } = require('../src/models/db');

function resetDb() {
  db.users = [];
  db.medications = [];
  db.doses = [];
  db._counters = {
    userId: 2,
    medId: 1,
    doseId: 1
  };
}

async function registerUser(email = 'alice@test.com', password = 'SenhaForte123') {
  const registerRes = await request(app)
    .post('/auth/register')
    .send({ email, password });

  if (registerRes.status !== 201) {
    throw new Error(`Registro falhou: ${registerRes.status} ${registerRes.body.message || ''}`);
  }

  if (!registerRes.body || !registerRes.body.token) {
    throw new Error('Registro não retornou token de autenticação');
  }

  return registerRes;
}

describe('API - Partição de Equivalência por verbos', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('POST /auth/register', () => {
    it('EP-01 deve registrar usuário com dados válidos', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'novo@test.com', password: 'SenhaForte123' });

      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id');
      expect(res.body.email).to.equal('novo@test.com');
    });

    it('EP-02 deve rejeitar email em formato inválido', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'email-invalido', password: 'SenhaForte123' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.match(/email|invalid|required/i);
    });

    it('EP-03 deve rejeitar senha vazia', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'vazio@test.com', password: '' });

      expect(res.status).to.equal(400);
    });

    it('EP-04 deve rejeitar cadastro duplicado', async () => {
      await registerUser('duplicado@test.com', 'SenhaForte123');

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'duplicado@test.com', password: 'OutraSenha456' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.match(/already exists|já existe|exist/i);
    });
  });

  describe('POST /auth/login', () => {
    it('EP-05 deve autenticar com credenciais válidas', async () => {
      await registerUser('login@test.com', 'SenhaForte123');

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'login@test.com', password: 'SenhaForte123' });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token');
    });

    it('EP-06 deve rejeitar usuário não cadastrado', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'naoexiste@test.com', password: 'SenhaForte123' });

      expect(res.status).to.equal(401);
      expect(res.body.message).to.match(/invalid|não encontrado|credentials/i);
    });

    it('EP-07 deve rejeitar senha incorreta', async () => {
      await registerUser('senhaerrada@test.com', 'SenhaForte123');

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'senhaerrada@test.com', password: 'SenhaErrada' });

      expect(res.status).to.equal(401);
    });
  });

  describe('POST /medications', () => {
    it('EP-08 deve criar medicamento com dados válidos', async () => {
      const registerRes = await registerUser('med@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Amoxicilina',
          dosage: '500',
          unit: 'mg',
          times: ['08:00', '20:00'],
          startDate: '2026-08-13',
          daysOfWeek: [1, 3, 5]
        });

      expect(res.status).to.equal(201);
      expect(res.body.name).to.equal('Amoxicilina');
      expect(res.body.times).to.deep.equal(['08:00', '20:00']);
    });

    it('EP-09 deve rejeitar criação sem autenticação', async () => {
      const res = await request(app)
        .post('/medications')
        .send({
          name: 'Paracetamol',
          dosage: '750',
          unit: 'mg',
          times: ['09:00'],
          startDate: '2026-08-13'
        });

      expect(res.status).to.equal(401);
    });

    it('EP-10 deve rejeitar medicamento com dados obrigatórios ausentes', async () => {
      const registerRes = await registerUser('dadosinvalidos@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
          dosage: '',
          unit: 'mg',
          times: [],
          startDate: ''
        });

      expect(res.status).to.equal(400);
    });
  });

  describe('GET /medications', () => {
    it('EP-11 deve listar medicamentos do usuário autenticado', async () => {
      const registerRes = await registerUser('listar@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Dipirona',
          dosage: '500',
          unit: 'mg',
          times: ['12:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .get('/medications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body[0].name).to.equal('Dipirona');
    });

    it('EP-12 deve retornar lista vazia para usuário sem medicamentos', async () => {
      const registerRes = await registerUser('vazio@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .get('/medications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal([]);
    });
  });

  describe('GET /medications/:id', () => {
    it('EP-13 deve retornar medicamento existente', async () => {
      const registerRes = await registerUser('getmed@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Ibuprofeno',
          dosage: '200',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .get(`/medications/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal('Ibuprofeno');
    });

    it('EP-14 deve rejeitar busca por medicamento inexistente', async () => {
      const registerRes = await registerUser('naoexist@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .get('/medications/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /medications/:id', () => {
    it('EP-15 deve atualizar medicamento com dados válidos', async () => {
      const registerRes = await registerUser('update@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Neosaldina',
          dosage: '10',
          unit: 'mg',
          times: ['07:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .put(`/medications/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Neosaldina Plus', dosage: '20' });

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal('Neosaldina Plus');
      expect(res.body.dosage).to.equal('20');
    });

    it('EP-16 deve rejeitar atualização de medicamento inexistente', async () => {
      const registerRes = await registerUser('update404@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .put('/medications/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Qualquer' });

      expect(res.status).to.equal(400);
    });
  });

  describe('DELETE /medications/:id', () => {
    it('EP-17 deve excluir medicamento existente', async () => {
      const registerRes = await registerUser('delete@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Rivotril',
          dosage: '2',
          unit: 'mg',
          times: ['22:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .delete(`/medications/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(204);
    });

    it('EP-18 deve rejeitar exclusão de medicamento inexistente', async () => {
      const registerRes = await registerUser('delete404@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .delete('/medications/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(400);
    });
  });

  describe('GET /doses', () => {
    it('EP-19 deve listar doses para uma data válida', async () => {
      const registerRes = await registerUser('doses@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Vitamina C',
          dosage: '500',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2026-08-13',
          daysOfWeek: [4]
        });

      const res = await request(app)
        .get('/doses')
        .query({ date: '2026-08-13' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body[0].medication.name).to.equal('Vitamina C');
    });

    it('EP-20 deve rejeitar data inválida', async () => {
      const registerRes = await registerUser('dosesinvalid@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .get('/doses')
        .query({ date: '2026/08/13' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(400);
    });
  });

  describe('POST /medications/:id/doses', () => {
    it('EP-21 deve registrar dose com ação válida take', async () => {
      const registerRes = await registerUser('doseTake@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Losartana',
          dosage: '50',
          unit: 'mg',
          times: ['21:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .post(`/medications/${created.body.id}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduled: '2026-08-13T21:00:00', action: 'take' });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('taken');
    });

    it('EP-22 deve rejeitar action inválida', async () => {
      const registerRes = await registerUser('doseInvalid@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Atenolol',
          dosage: '25',
          unit: 'mg',
          times: ['18:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .post(`/medications/${created.body.id}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduled: '2026-08-13T18:00:00', action: 'invalid' });

      expect(res.status).to.equal(400);
    });
  });

  describe('GET /medications/:id/history', () => {
    it('EP-23 deve retornar histórico com filtros válidos', async () => {
      const registerRes = await registerUser('history@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Omeprazol',
          dosage: '20',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2026-08-13'
        });

      await request(app)
        .post(`/medications/${created.body.id}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduled: '2026-08-13T08:00:00', action: 'take' });

      const res = await request(app)
        .get(`/medications/${created.body.id}/history`)
        .query({ from: '2026-08-13', to: '2026-08-14' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body[0].status).to.equal('taken');
    });

    it('EP-24 deve rejeitar filtro de data inválida', async () => {
      const registerRes = await registerUser('historyInvalid@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Metformina',
          dosage: '850',
          unit: 'mg',
          times: ['10:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .get(`/medications/${created.body.id}/history`)
        .query({ from: '2026/08/13' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(400);
    });
  });

  describe('Casos extras de validação', () => {
    it('EP-25 deve rejeitar dose sem identificação da medicação', async () => {
      const registerRes = await registerUser('doseSemMedicacao@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .post('/medications/999999/doses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          scheduled: '2026-08-13T08:00:00',
          action: 'take'
        });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.match(/not found|medication/i);
    });

    it('EP-26 deve rejeitar token sem prefixo Bearer', async () => {
      const registerRes = await registerUser('tokenSemBearer@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .get('/medications')
        .set('Authorization', token);

      expect(res.status).to.equal(401);
    });

    it('EP-27 deve rejeitar intervalo de datas invertido no histórico', async () => {
      const registerRes = await registerUser('historicoInvertido@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Paroxetina',
          dosage: '10',
          unit: 'mg',
          times: ['18:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .get(`/medications/${created.body.id}/history`)
        .query({ from: '2026-08-14', to: '2026-08-13' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(400);
    });

    it('EP-28 deve impedir que um usuário consulte medicamento de outro usuário', async () => {
      const owner = await registerUser('dono@test.com', 'SenhaForte123');
      const otherUser = await registerUser('outro@test.com', 'SenhaForte123');

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${owner.body.token}`)
        .send({
          name: 'Medicamento privado',
          dosage: '10',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .get(`/medications/${created.body.id}`)
        .set('Authorization', `Bearer ${otherUser.body.token}`);

      expect(res.status).to.equal(404);
    });

    it('EP-29 deve retornar doses pendentes e permitir desmarcar uma dose tomada', async () => {
      const registerRes = await registerUser('desmarcar@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Levotiroxina',
          dosage: '50',
          unit: 'mcg',
          times: ['07:00'],
          startDate: '2026-08-13'
        });

      const taken = await request(app)
        .post(`/medications/${created.body.id}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduled: '2026-08-13T07:00:00', action: 'take' });

      expect(taken.status).to.equal(200);
      expect(taken.body.status).to.equal('taken');

      const res = await request(app)
        .post(`/medications/${created.body.id}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({ scheduled: '2026-08-13T07:00:00', action: 'unmark' });

      expect(res.status).to.equal(200);
      expect(res.body.status).to.equal('pending');
      expect(res.body.takenAt).to.equal(null);
    });

    it('EP-30 deve rejeitar registro de dose sem horário agendado', async () => {
      const registerRes = await registerUser('doseSemHorario@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const created = await request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'AAS',
          dosage: '100',
          unit: 'mg',
          times: ['09:00'],
          startDate: '2026-08-13'
        });

      const res = await request(app)
        .post(`/medications/${created.body.id}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({ action: 'take' });

      expect(res.status).to.equal(400);
      expect(res.body.message).to.match(/scheduled|required/i);
    });

    it('EP-31 deve retornar lista vazia de doses quando não há medicamentos para o dia', async () => {
      const registerRes = await registerUser('semDoses@test.com', 'SenhaForte123');
      const token = registerRes.body.token;

      const res = await request(app)
        .get('/doses')
        .query({ date: '2026-08-13' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal([]);
    });
  });
});
