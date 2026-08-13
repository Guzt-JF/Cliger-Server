const App = require('../app');
const request = require('supertest');

describe('Testes de gravação de vendas', () => {
  it('Deve Criar um Novo Registro', async () => {
    const result = await request(App)
      .post('/SalesRecord/newRecord')
      .send({
        TotalBuyPrice: 67,
        MoneyPayed: 67,
        PayBack: 0,
        userId: 1,
        ProductId: [1],
        Amount: [1],
        Weight: [1],
      });
    expect(result.body.message).toBe('Sucesso ao criar registro');
  });

  it('Deve Encontrar Um Registro', async () => {
    const result = await request(App).post('/SalesRecord/GetOneProduct').send({
      id: 1,
      userId: 1,
    });
    expect(
      result.body.message != 'Não foi possível obter os dados'
    ).toBeTruthy();
  });
});
