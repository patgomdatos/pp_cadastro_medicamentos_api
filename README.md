# Controle Diário de Medicamentos

Projeto com API REST para controle diário de medicamentos.

## Sobre o sistema

O sistema ajuda o usuário a organizar sua rotina de medicamentos e acompanhar as doses previstas e realizadas. Cada usuário possui seus próprios medicamentos e só pode consultar ou alterar os dados associados à sua conta.

A API oferece os seguintes recursos:

- criação de conta e autenticação de usuários;
- geração de tokens JWT para proteger as operações da API;
- cadastro de medicamentos com nome, dosagem, unidade, horários, data de início e dias da semana;
- consulta, atualização e remoção de medicamentos;
- listagem das doses programadas para uma data específica;
- registro de uma dose como tomada ou retorno da dose para o estado pendente;
- consulta do histórico de doses de um medicamento.

## Fluxo básico de utilização

1. Crie uma conta usando `POST /auth/register` ou autentique-se usando `POST /auth/login`.
2. Armazene o token JWT retornado pela autenticação.
3. Envie o token no header `Authorization: Bearer <token>` nas rotas protegidas.
4. Cadastre os medicamentos e seus horários usando `POST /medications`.
5. Consulte as doses do dia usando `GET /doses?date=YYYY-MM-DD`.
6. Registre a dose tomada usando `POST /medications/:id/doses`.
7. Consulte o histórico usando `GET /medications/:id/history`.

## Estrutura

- `api/` - Backend Express (porta padrão `3000`)
- `api/test/` - testes automatizados com Mocha, Chai e Supertest
- `resources/swagger.yaml` - Especificação OpenAPI (Swagger)

## Requisitos

- Node 16+ (npm)

## Como executar a API

```bash
cd api
npm install
npm start
```

Opcionalmente, pode configurar porta e secret JWT antes de iniciar:

```powershell
cd api
$env:PORT=3000
$env:JWT_SECRET='minha_chave'
npm start
```

A API roda em `http://localhost:3000`.
A documentação Swagger fica em `http://localhost:3000/docs`.

## Como executar os testes

Instale as dependências de desenvolvimento e rode a suíte:

```bash
cd api
npm install
npm test
```

Para executar apenas um arquivo específico de teste:

```bash
cd api
npx mocha test/equivalence-partition.test.js --timeout 10000 --reporter spec
```

Para rodar apenas um teste específico usando filtro por nome:

```bash
cd api
npx mocha test/equivalence-partition.test.js --grep "EP-25" --reporter spec
```

## Arquivos de teste

- `api/test/equivalence-partition.test.js` - suíte principal de testes por partição de equivalência
- `api/test/comprehensive.test.js` - testes mais abrangentes da API
- `api/test/auth.test.js` - testes de autenticação
- `api/test/medications.test.js` - testes de medicamentos

## Como ler o resultado dos testes

- `✓` indica que o teste passou
- `✖` indica que o teste falhou
- `N passing` mostra quantos testes passaram
- `N failing` mostra quantos falharam

Exemplo:

```bash
  24 passing (1s)
  3 failing
```

Isso significa que 24 testes passaram e 3 falharam.

## Endpoints principais

- `POST /auth/register` - registrar usuário
- `POST /auth/login` - login (retorna `token` JWT)
- `POST /medications` - criar medicamento (autenticado)
- `GET /medications` - listar medicamentos do usuário (autenticado)
- `GET /medications/:id` - consultar medicamento por id (autenticado)
- `PUT /medications/:id` - atualizar medicamento (autenticado)
- `DELETE /medications/:id` - remover medicamento (autenticado)
- `GET /doses?date=YYYY-MM-DD` - listar doses previstas para o dia (autenticado)
- `POST /medications/:id/doses` - registrar dose como tomada ou desmarcar (autenticado)
- `GET /medications/:id/history` - histórico de doses por medicamento (autenticado)

Use o header `Authorization: Bearer <token>` nas rotas que exigem autenticação.

## Armazenamento

Os dados são mantidos em memória em arrays. Reiniciar o servidor limpa o estado.

## Observações

- Senhas são armazenadas com `bcryptjs`.
- Autenticação é por JWT usando middleware.
- A aplicação web consome a API em `http://localhost:3000`.
- Os testes automatizados usam `Mocha`, `Chai` e `Supertest`.

