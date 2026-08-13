const sequelize = require('../config/database');
const SystemState = require('../models/systemState');
const generatePreLoadToken = require('../utils/generatePreLoadToken');
const getToday = require('../utils/getTotal');
const bcrypt = require('bcryptjs');

let running = false;


async function resetDatabase() {
  const queryInterface = sequelize.getQueryInterface();

  const tables = await queryInterface.showAllTables();

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

  try {
    for (const table of tables) {
      if (table === 'system_state') {
        continue;
      }

      await queryInterface.bulkDelete(table, null, {});
    }
  } finally {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function createTestUser() {
  const User = require('../models/user');

  const Token = generatePreLoadToken();
  bcrypt.hash('123456789', 10, async (err, hash) => {
    const result = await User.create({
      UserName: 'Test',
      Email: 'mail@test.com',
      Password: hash,
      BirthDate: '2000-01-01',
      PhoneNumber: '12345678901',
      ResetToken: null,
      ConfirmToken: Token,
    });
  });
}

module.exports = async (req, res, next) => {
  try {
    const today = getToday();
    console.log(`\n\n\n[DAILY RESET] Verificando se é um novo dia: ${today}`);

    if (!running) {
      running = true;

      try {
        await SystemState.sync();

        let state = await SystemState.findByPk(1);

        if (!state) {
          state = await SystemState.create({
            id: 1,
            lastRequest: today,
          });
        }
        if (state.lastRequest !== today) {
          console.log(
            `[DAILY RESET] Novo dia detectado: ${state.lastRequest} -> ${today}`
          );

          await resetDatabase();

          await createTestUser();

          await state.update({
            lastRequest: today,
          });

          console.log('[DAILY RESET] Banco resetado com sucesso.');
        }
      } finally {
        running = false;
      }
    }

    next();
  } catch (error) {
    console.error('[DAILY RESET] Erro:', error);

    next(error);
  }
};

