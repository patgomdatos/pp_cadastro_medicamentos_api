# Testes Automatizados - API de Cadastro de Medicamentos

Pasta contendo testes automatizados para a API.

## 📋 Testes Disponíveis

### 1. `auth.test.js` - Teste de Autenticação Completo
Valida o fluxo completo de geração e verificação de tokens JWT:
- Login e geração de token
- Decodificação do token
- Verificação com secret
- Validação de usuário no banco de dados
- Teste com token inválido

**Executar:**
```bash
node test/auth.test.js
```

### 2. `auth.diagnostic.js` - Teste Diagnóstico
Diagnostica possíveis problemas com tokens inválidos:
- Verifica configuração do JWT_SECRET
- Lista usuários no banco de dados
- Testa geração de token
- Simula requisição HTTP com Bearer token
- Testa token expirado
- Testa token com secret errado

**Executar:**
```bash
node test/auth.diagnostic.js
```

### 3. `medications.test.js` - Teste de Medicamentos
Testa operações CRUD de medicamentos com autenticação:
- Login
- Adicionar medicamento
- Listar medicamentos
- Adicionar dose
- Atualizar medicamento
- Deletar dose
- Deletar medicamento

**Executar:**
```bash
node test/medications.test.js
```

## ▶️ Executar Todos os Testes

```bash
node test/run-all.js
```

## 🔍 Possíveis Causas de "Token Inválido"

Se receber "token inválido", o teste diagnóstico ajudará a identificar:

1. **Token expirado** - Verificar timestamp `exp`
2. **Secret diferente** - Verificar se .env está configurado
3. **Token gerado com secret errado** - Regenerar token
4. **Erro no formato** - Verificar se o header Authorization está correto

## 📝 Exemplo de Uso

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@local", "password": "senha123"}'

# Usar o token retornado
curl -X GET http://localhost:3000/medications \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## ✅ Testes Esperados para Passar

- ✓ Token gerado com sucesso
- ✓ Token verificado com sucesso
- ✓ Usuário encontrado no banco de dados
- ✓ Autenticação completa bem-sucedida
- ✓ Token expirado corretamente rejeitado
- ✓ Token com secret errado corretamente rejeitado
- ✓ Medicamentos CRUD funcionando com autenticação
