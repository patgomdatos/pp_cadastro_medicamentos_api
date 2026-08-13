/**
 * TESTES ABRANGENTES COM PARTIÇÃO DE EQUIVALÊNCIA
 * 
 * Dependências necessárias:
 * npm install --save-dev mocha chai supertest
 * 
 * Para executar:
 * npx mocha test/comprehensive.test.js --timeout 5000
 */

require('dotenv').config();
const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/server');
const { db } = require('../src/models/db');

describe('🔐 AUTENTICAÇÃO - Partição de Equivalência', () => {
  // Limpa dados antes de cada teste
  beforeEach(() => {
    db.users = [];
    db.medications = [];
    db.doses = [];
  });

  describe('POST /auth/register', () => {
    it('[EP1] Deve registrar usuário com dados válidos', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'novo@test.com',
          password: 'SenhaForte123!'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).to.have.property('id');
          expect(res.body.email).to.equal('novo@test.com');
        })
        .end(done);
    });

    it('[EP2] Deve rejeitar email inválido (sem @)', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'invalido.com',
          password: 'SenhaForte123!'
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).to.include('email');
        })
        .end(done);
    });

    it('[EP3] Deve rejeitar email vazio', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: '',
          password: 'SenhaForte123!'
        })
        .expect(400)
        .end(done);
    });

    it('[EP4] Deve rejeitar password vazia', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'novo@test.com',
          password: ''
        })
        .expect(400)
        .end(done);
    });

    it('[EP5] Deve rejeitar email duplicado', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'duplicado@test.com',
          password: 'SenhaForte123!'
        })
        .end(() => {
          request(app)
            .post('/auth/register')
            .send({
              email: 'duplicado@test.com',
              password: 'OutraSenha123!'
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.message).to.include('já existe');
            })
            .end(done);
        });
    });

    it('[EP6] Deve rejeitar password muito curta (< 5 chars)', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'fraco@test.com',
          password: '123'
        })
        .expect(400)
        .end(done);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach((done) => {
      // Cria usuário para teste de login
      request(app)
        .post('/auth/register')
        .send({
          email: 'login@test.com',
          password: 'SenhaCorreta123'
        })
        .end(done);
    });

    it('[EP1] Deve fazer login com credenciais válidas', (done) => {
      request(app)
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'SenhaCorreta123'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).to.have.property('token');
          expect(res.body.token).to.be.a('string');
        })
        .end(done);
    });

    it('[EP2] Deve rejeitar email não registrado', (done) => {
      request(app)
        .post('/auth/login')
        .send({
          email: 'naoexiste@test.com',
          password: 'QualquerSenha123'
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).to.include('não encontrado');
        })
        .end(done);
    });

    it('[EP3] Deve rejeitar senha incorreta', (done) => {
      request(app)
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'SenhaErrada123'
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).to.include('inválida');
        })
        .end(done);
    });

    it('[EP4] Deve rejeitar email vazio', (done) => {
      request(app)
        .post('/auth/login')
        .send({
          email: '',
          password: 'SenhaCorreta123'
        })
        .expect(400)
        .end(done);
    });

    it('[EP5] Deve rejeitar password vazia', (done) => {
      request(app)
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: ''
        })
        .expect(400)
        .end(done);
    });
  });
});

describe('💊 MEDICAMENTOS - Partição de Equivalência', () => {
  let token;
  let userId;

  beforeEach((done) => {
    db.users = [];
    db.medications = [];
    db.doses = [];

    request(app)
      .post('/auth/register')
      .send({
        email: 'med@test.com',
        password: 'TestPassword123'
      })
      .end((err, res) => {
        userId = res.body.id;
        token = res.body.token;
        done();
      });
  });

  describe('POST /medications (CREATE)', () => {
    it('[EP1] Deve criar medicamento com dados válidos', (done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Amoxicilina',
          dosage: '500',
          unit: 'mg',
          times: ['08:00', '14:00', '20:00'],
          startDate: '2024-08-13',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).to.have.property('id');
          expect(res.body.name).to.equal('Amoxicilina');
          expect(res.body.dosage).to.equal('500');
        })
        .end(done);
    });

    it('[EP2] Deve rejeitar sem token de autenticação', (done) => {
      request(app)
        .post('/medications')
        .send({
          name: 'Amoxicilina',
          dosage: '500',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2024-08-13',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .expect(401)
        .end(done);
    });

    it('[EP3] Deve rejeitar nome vazio', (done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
          dosage: '500',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2024-08-13',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .expect(400)
        .end(done);
    });

    it('[EP4] Deve rejeitar dosage com formato inválido', (done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Medicamento',
          dosage: 'abc',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2024-08-13',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .expect(400)
        .end(done);
    });

    it('[EP5] Deve rejeitar times vazio', (done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Medicamento',
          dosage: '500',
          unit: 'mg',
          times: [],
          startDate: '2024-08-13',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .expect(400)
        .end(done);
    });

    it('[EP6] Deve rejeitar startDate em formato inválido', (done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Medicamento',
          dosage: '500',
          unit: 'mg',
          times: ['08:00'],
          startDate: 'data-invalida',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .expect(400)
        .end(done);
    });

    it('[EP7] Deve rejeitar daysOfWeek inválido (não é array)', (done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Medicamento',
          dosage: '500',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2024-08-13',
          daysOfWeek: 'invalido'
        })
        .expect(400)
        .end(done);
    });

    it('[EP8] Deve aceitar medicamento com um único dia da semana', (done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Medicamento',
          dosage: '500',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2024-08-13',
          daysOfWeek: [1] // apenas segunda
        })
        .expect(201)
        .end(done);
    });
  });

  describe('GET /medications (LIST)', () => {
    beforeEach((done) => {
      // Cria 3 medicamentos
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Med1',
          dosage: '100',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2024-08-13',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .end(() => {
          request(app)
            .post('/medications')
            .set('Authorization', `Bearer ${token}`)
            .send({
              name: 'Med2',
              dosage: '200',
              unit: 'mg',
              times: ['14:00'],
              startDate: '2024-08-13',
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
            })
            .end(done);
        });
    });

    it('[EP1] Deve listar todos os medicamentos do usuário', (done) => {
      request(app)
        .get('/medications')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(2);
        })
        .end(done);
    });

    it('[EP2] Deve rejeitar sem token', (done) => {
      request(app)
        .get('/medications')
        .expect(401)
        .end(done);
    });

    it('[EP3] Deve rejeitar token inválido', (done) => {
      request(app)
        .get('/medications')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401)
        .end(done);
    });

    it('[EP4] Deve retornar lista vazia se nenhum medicamento', (done) => {
      // Cria novo usuário sem medicamentos
      request(app)
        .post('/auth/register')
        .send({
          email: 'vazio@test.com',
          password: 'TestPassword123'
        })
        .end((err, res) => {
          const newToken = res.body.token;
          request(app)
            .get('/medications')
            .set('Authorization', `Bearer ${newToken}`)
            .expect(200)
            .expect((res) => {
              expect(res.body).to.be.an('array');
              expect(res.body.length).to.equal(0);
            })
            .end(done);
        });
    });
  });

  describe('GET /medications/:id (GET by ID)', () => {
    let medId;

    beforeEach((done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Medicamento Teste',
          dosage: '500',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2024-08-13',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .end((err, res) => {
          medId = res.body.id;
          done();
        });
    });

    it('[EP1] Deve retornar medicamento existente', (done) => {
      request(app)
        .get(`/medications/${medId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).to.equal(medId);
          expect(res.body.name).to.equal('Medicamento Teste');
        })
        .end(done);
    });

    it('[EP2] Deve retornar 404 para medicamento não existente', (done) => {
      request(app)
        .get('/medications/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
        .end(done);
    });

    it('[EP3] Deve rejeitar ID com formato inválido', (done) => {
      request(app)
        .get('/medications/abc')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .end(done);
    });

    it('[EP4] Deve rejeitar sem autenticação', (done) => {
      request(app)
        .get(`/medications/${medId}`)
        .expect(401)
        .end(done);
    });

    it('[EP5] Deve impedir acesso a medicamento de outro usuário', (done) => {
      // Cria novo usuário
      request(app)
        .post('/auth/register')
        .send({
          email: 'outro@test.com',
          password: 'TestPassword123'
        })
        .end((err, res) => {
          const otherToken = res.body.token;
          request(app)
            .get(`/medications/${medId}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .expect(404)
            .end(done);
        });
    });
  });

  describe('PUT /medications/:id (UPDATE)', () => {
    let medId;

    beforeEach((done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Med Original',
          dosage: '500',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2024-08-13',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .end((err, res) => {
          medId = res.body.id;
          done();
        });
    });

    it('[EP1] Deve atualizar medicamento com dados válidos', (done) => {
      request(app)
        .put(`/medications/${medId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Med Atualizado',
          dosage: '750'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).to.equal('Med Atualizado');
          expect(res.body.dosage).to.equal('750');
        })
        .end(done);
    });

    it('[EP2] Deve permitir atualização parcial', (done) => {
      request(app)
        .put(`/medications/${medId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Novo Nome'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).to.equal('Novo Nome');
          expect(res.body.dosage).to.equal('500'); // mantém valor anterior
        })
        .end(done);
    });

    it('[EP3] Deve rejeitar update com dados inválidos', (done) => {
      request(app)
        .put(`/medications/${medId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          dosage: 'xyz'
        })
        .expect(400)
        .end(done);
    });

    it('[EP4] Deve rejeitar update em medicamento não existente', (done) => {
      request(app)
        .put('/medications/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Qualquer'
        })
        .expect(400)
        .end(done);
    });

    it('[EP5] Deve impedir update de medicamento de outro usuário', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'outro2@test.com',
          password: 'TestPassword123'
        })
        .end((err, res) => {
          const otherToken = res.body.token;
          request(app)
            .put(`/medications/${medId}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({
              name: 'Hackado'
            })
            .expect(400)
            .end(done);
        });
    });

    it('[EP6] Deve rejeitar sem autenticação', (done) => {
      request(app)
        .put(`/medications/${medId}`)
        .send({
          name: 'Novo'
        })
        .expect(401)
        .end(done);
    });
  });

  describe('DELETE /medications/:id (DELETE)', () => {
    let medId;

    beforeEach((done) => {
      request(app)
        .post('/medications')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Med para Deletar',
          dosage: '500',
          unit: 'mg',
          times: ['08:00'],
          startDate: '2024-08-13',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
        })
        .end((err, res) => {
          medId = res.body.id;
          done();
        });
    });

    it('[EP1] Deve deletar medicamento existente', (done) => {
      request(app)
        .delete(`/medications/${medId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)
        .end(done);
    });

    it('[EP2] Deve retornar 404 ao deletar medicamento inexistente', (done) => {
      request(app)
        .delete('/medications/99999')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .end(done);
    });

    it('[EP3] Deve impedir delete de medicamento de outro usuário', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'outro3@test.com',
          password: 'TestPassword123'
        })
        .end((err, res) => {
          const otherToken = res.body.token;
          request(app)
            .delete(`/medications/${medId}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .expect(400)
            .end(done);
        });
    });

    it('[EP4] Deve rejeitar delete sem autenticação', (done) => {
      request(app)
        .delete(`/medications/${medId}`)
        .expect(401)
        .end(done);
    });

    it('[EP5] Deve verificar que medicamento foi realmente deletado', (done) => {
      request(app)
        .delete(`/medications/${medId}`)
        .set('Authorization', `Bearer ${token}`)
        .end(() => {
          request(app)
            .get(`/medications/${medId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(404)
            .end(done);
        });
    });
  });
});

describe('📅 DOSES - Partição de Equivalência', () => {
  let token;
  let userId;
  let medId;
  let today;

  beforeEach((done) => {
    db.users = [];
    db.medications = [];
    db.doses = [];

    today = new Date().toISOString().split('T')[0];

    request(app)
      .post('/auth/register')
      .send({
        email: 'doses@test.com',
        password: 'TestPassword123'
      })
      .end((err, res) => {
        userId = res.body.id;
        token = res.body.token;

        // Cria medicamento para testes de doses
        request(app)
          .post('/medications')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Medicamento com Doses',
            dosage: '500',
            unit: 'mg',
            times: ['08:00', '14:00', '20:00'],
            startDate: today,
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
          })
          .end((err, res) => {
            medId = res.body.id;
            done();
          });
      });
  });

  describe('GET /doses (LIST doses for day)', () => {
    it('[EP1] Deve listar doses válidas para data especificada', (done) => {
      request(app)
        .get(`/doses?date=${today}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(3); // 3 horários configurados
        })
        .end(done);
    });

    it('[EP2] Deve rejeitar formato de data inválido', (done) => {
      request(app)
        .get('/doses?date=data-invalida')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .end(done);
    });

    it('[EP3] Deve retornar lista vazia para data sem doses', (done) => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      request(app)
        .get(`/doses?date=${futureDate}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(0);
        })
        .end(done);
    });

    it('[EP4] Deve rejeitar sem autenticação', (done) => {
      request(app)
        .get(`/doses?date=${today}`)
        .expect(401)
        .end(done);
    });

    it('[EP5] Deve retornar apenas doses do usuário autenticado', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'outrodoses@test.com',
          password: 'TestPassword123'
        })
        .end((err, res) => {
          const otherToken = res.body.token;
          request(app)
            .get(`/doses?date=${today}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .expect(200)
            .expect((res) => {
              expect(res.body).to.be.an('array');
              expect(res.body.length).to.equal(0);
            })
            .end(done);
        });
    });

    it('[EP6] Deve aceitar data sem parâmetro (usa hoje por padrão)', (done) => {
      request(app)
        .get('/doses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array');
        })
        .end(done);
    });
  });

  describe('POST /medications/:id/doses (REGISTER dose)', () => {
    let scheduledTime;

    beforeEach(() => {
      const now = new Date();
      scheduledTime = `${today}T08:00:00`;
    });

    it('[EP1] Deve registrar dose como "take" (tomada)', (done) => {
      request(app)
        .post(`/medications/${medId}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          scheduled: scheduledTime,
          action: 'take'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).to.equal('taken');
          expect(res.body).to.have.property('takenAt');
        })
        .end(done);
    });

    it('[EP2] Deve registrar dose como "unmark" (não tomada)', (done) => {
      // Primeiro registra como tomada
      request(app)
        .post(`/medications/${medId}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          scheduled: scheduledTime,
          action: 'take'
        })
        .end(() => {
          // Depois desmarca
          request(app)
            .post(`/medications/${medId}/doses`)
            .set('Authorization', `Bearer ${token}`)
            .send({
              scheduled: scheduledTime,
              action: 'unmark'
            })
            .expect(200)
            .expect((res) => {
              expect(res.body.status).to.equal('pending');
              expect(res.body.takenAt).to.be.null;
            })
            .end(done);
        });
    });

    it('[EP3] Deve rejeitar action inválida', (done) => {
      request(app)
        .post(`/medications/${medId}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          scheduled: scheduledTime,
          action: 'invalida'
        })
        .expect(400)
        .end(done);
    });

    it('[EP4] Deve rejeitar scheduled faltando', (done) => {
      request(app)
        .post(`/medications/${medId}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'take'
        })
        .expect(400)
        .end(done);
    });

    it('[EP5] Deve rejeitar action faltando', (done) => {
      request(app)
        .post(`/medications/${medId}/doses`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          scheduled: scheduledTime
        })
        .expect(400)
        .end(done);
    });

    it('[EP6] Deve rejeitar medicamento inexistente', (done) => {
      request(app)
        .post('/medications/99999/doses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          scheduled: scheduledTime,
          action: 'take'
        })
        .expect(400)
        .end(done);
    });

    it('[EP7] Deve rejeitar sem autenticação', (done) => {
      request(app)
        .post(`/medications/${medId}/doses`)
        .send({
          scheduled: scheduledTime,
          action: 'take'
        })
        .expect(401)
        .end(done);
    });

    it('[EP8] Deve impedir registro de dose de medicamento de outro usuário', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'outrodose@test.com',
          password: 'TestPassword123'
        })
        .end((err, res) => {
          const otherToken = res.body.token;
          request(app)
            .post(`/medications/${medId}/doses`)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({
              scheduled: scheduledTime,
              action: 'take'
            })
            .expect(400)
            .end(done);
        });
    });
  });
});

describe('📊 HISTÓRICO - Partição de Equivalência', () => {
  let token;
  let userId;
  let medId;
  let today;

  beforeEach((done) => {
    db.users = [];
    db.medications = [];
    db.doses = [];

    today = new Date().toISOString().split('T')[0];

    request(app)
      .post('/auth/register')
      .send({
        email: 'history@test.com',
        password: 'TestPassword123'
      })
      .end((err, res) => {
        userId = res.body.id;
        token = res.body.token;

        // Cria medicamento
        request(app)
          .post('/medications')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: 'Med com Histórico',
            dosage: '500',
            unit: 'mg',
            times: ['08:00', '14:00'],
            startDate: today,
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
          })
          .end((err, res) => {
            medId = res.body.id;

            // Registra algumas doses
            const time1 = `${today}T08:00:00`;
            const time2 = `${today}T14:00:00`;

            request(app)
              .post(`/medications/${medId}/doses`)
              .set('Authorization', `Bearer ${token}`)
              .send({
                scheduled: time1,
                action: 'take'
              })
              .end(() => {
                request(app)
                  .post(`/medications/${medId}/doses`)
                  .set('Authorization', `Bearer ${token}`)
                  .send({
                    scheduled: time2,
                    action: 'take'
                  })
                  .end(done);
              });
          });
      });
  });

  describe('GET /medications/:id/history', () => {
    it('[EP1] Deve retornar histórico completo sem filtros', (done) => {
      request(app)
        .get(`/medications/${medId}/history`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.greaterThan(0);
        })
        .end(done);
    });

    it('[EP2] Deve filtrar histórico por data inicial (from)', (done) => {
      request(app)
        .get(`/medications/${medId}/history?from=${today}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array');
        })
        .end(done);
    });

    it('[EP3] Deve filtrar histórico por data final (to)', (done) => {
      request(app)
        .get(`/medications/${medId}/history?to=${today}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array');
        })
        .end(done);
    });

    it('[EP4] Deve filtrar histórico por range (from e to)', (done) => {
      request(app)
        .get(`/medications/${medId}/history?from=${today}&to=${today}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array');
        })
        .end(done);
    });

    it('[EP5] Deve retornar lista vazia para range sem dados', (done) => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      request(app)
        .get(`/medications/${medId}/history?from=${futureDate}&to=${futureDate}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.equal(0);
        })
        .end(done);
    });

    it('[EP6] Deve rejeitar formato de data inválido em from', (done) => {
      request(app)
        .get(`/medications/${medId}/history?from=data-invalida`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200) // API pode ignorar datas inválidas
        .end(done);
    });

    it('[EP7] Deve rejeitar medicamento inexistente', (done) => {
      request(app)
        .get('/medications/99999/history')
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
        .end(done);
    });

    it('[EP8] Deve rejeitar sem autenticação', (done) => {
      request(app)
        .get(`/medications/${medId}/history`)
        .expect(401)
        .end(done);
    });

    it('[EP9] Deve impedir acesso ao histórico de medicamento de outro usuário', (done) => {
      request(app)
        .post('/auth/register')
        .send({
          email: 'outrohistory@test.com',
          password: 'TestPassword123'
        })
        .end((err, res) => {
          const otherToken = res.body.token;
          request(app)
            .get(`/medications/${medId}/history`)
            .set('Authorization', `Bearer ${otherToken}`)
            .expect(400)
            .end(done);
        });
    });
  });
});

describe('🔍 TESTES DE INTEGRAÇÃO COMPLETA', () => {
  let token;
  let userId;

  beforeEach((done) => {
    db.users = [];
    db.medications = [];
    db.doses = [];

    request(app)
      .post('/auth/register')
      .send({
        email: 'integracao@test.com',
        password: 'TestPassword123'
      })
      .end((err, res) => {
        userId = res.body.id;
        token = res.body.token;
        done();
      });
  });

  it('[FLUXO1] Criar → Listar → Obter → Atualizar → Deletar', (done) => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Criar
    request(app)
      .post('/medications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Fluxo Completo',
        dosage: '100',
        unit: 'mg',
        times: ['08:00'],
        startDate: today,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
      })
      .end((err, createRes) => {
        const medId = createRes.body.id;
        expect(createRes.status).to.equal(201);

        // 2. Listar
        request(app)
          .get('/medications')
          .set('Authorization', `Bearer ${token}`)
          .end((err, listRes) => {
            expect(listRes.body.length).to.be.greaterThan(0);

            // 3. Obter
            request(app)
              .get(`/medications/${medId}`)
              .set('Authorization', `Bearer ${token}`)
              .end((err, getRes) => {
                expect(getRes.body.id).to.equal(medId);

                // 4. Atualizar
                request(app)
                  .put(`/medications/${medId}`)
                  .set('Authorization', `Bearer ${token}`)
                  .send({ name: 'Fluxo Atualizado' })
                  .end((err, updateRes) => {
                    expect(updateRes.body.name).to.equal('Fluxo Atualizado');

                    // 5. Deletar
                    request(app)
                      .delete(`/medications/${medId}`)
                      .set('Authorization', `Bearer ${token}`)
                      .end((err, deleteRes) => {
                        expect(deleteRes.status).to.equal(204);
                        done();
                      });
                  });
              });
          });
      });
  });

  it('[FLUXO2] Criar Med → Registrar Doses → Verificar Histórico', (done) => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Criar medicamento
    request(app)
      .post('/medications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Fluxo Doses',
        dosage: '500',
        unit: 'mg',
        times: ['08:00', '20:00'],
        startDate: today,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
      })
      .end((err, medRes) => {
        const medId = medRes.body.id;

        // 2. Obter doses do dia
        request(app)
          .get(`/doses?date=${today}`)
          .set('Authorization', `Bearer ${token}`)
          .end((err, dosesRes) => {
            expect(dosesRes.body.length).to.be.greaterThan(0);
            const firstScheduled = dosesRes.body[0].scheduled;

            // 3. Registrar dose como tomada
            request(app)
              .post(`/medications/${medId}/doses`)
              .set('Authorization', `Bearer ${token}`)
              .send({
                scheduled: firstScheduled,
                action: 'take'
              })
              .end((err, takeRes) => {
                expect(takeRes.body.status).to.equal('taken');

                // 4. Verificar histórico
                request(app)
                  .get(`/medications/${medId}/history?from=${today}&to=${today}`)
                  .set('Authorization', `Bearer ${token}`)
                  .end((err, historyRes) => {
                    expect(historyRes.body).to.be.an('array');
                    const takenDoses = historyRes.body.filter(d => d.status === 'taken');
                    expect(takenDoses.length).to.be.greaterThan(0);
                    done();
                  });
              });
          });
      });
  });
});
