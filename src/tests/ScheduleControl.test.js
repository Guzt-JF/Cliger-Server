const App = require('../app');
const request = require('supertest');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

let Hour = getRandomInt(10, 23);
let Minute = getRandomInt(0, 5);
let Year = getRandomInt(10, 99);
let day = getRandomInt(10, 28);

let ScheduledHour = `${Hour}:${Minute}0`;
let ScheduledDay = `20${Year}-04-${day}`;

describe("Testes de Agendamento", () => {
  it('Deve Criar um Novo Registro', async () => {
    const result = await request(App)
      .post('/schedule/register')
      .send({
        ScheduledDay: ScheduledDay,
        ScheduledHour: ScheduledHour,
        ClientName: 'John',
        userId: 1,
        ProSerId: [1, 2],
      });
    expect(result.body.message).toBe('Sucesso ao criar registro');
  });

  it('Deve Encontrar Este Registro', async () => {
    const result = await request(App).post('/schedule/getOne').send({
      ScheduledDay: ScheduledDay,
      ScheduledHour: ScheduledHour,
      userId: 1,
    });
    expect(
      result.body.message != 'Não foi possível encontrar o registro' ||
        result.body.Error != "Não foi possível obter os dados"
    ).toBeTruthy();
  });

  it('Deve Encontrar Todos os Registros do Dia', async () => {
    const result = await request(App).post('/schedule/getAllFromDay').send({
      ScheduledDay: ScheduledDay,
      userId: 1,
    });
    expect(result.body.Error != "Não foi possível obter os dados").toBeTruthy();
  });

  it('Deve Deletar Este Registro', async () => {
    const result = await request(App).post('/schedule/delete/One').send({
      ScheduledDay: ScheduledDay,
      ScheduledHour: ScheduledHour,
      userId: 1,
    });
    expect(result.body.message).toBe('Agendamento deletado');
  });
});
