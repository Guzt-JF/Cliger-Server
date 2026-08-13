const App = require('../app');
const request = require('supertest');

describe("Testes de Finanças", () => {
  it('Deve Criar um Novo Registro', async () => {
    const result = await request(App).post('/finance/register').send({
      CurrentBalance: 20,
      userId: 1,
    });
    expect(result.body.message).toBe('Sucesso ao criar registro');
  });

  it('Deve Encontrar Todos os Registros', async () => {
    const result = await request(App).post('/finance/getAll').send({
      userId: 1,
    });
    expect(result.body.Error != "Não foi possível obter os dados").toBeTruthy();
  });
});
