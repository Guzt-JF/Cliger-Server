const express = require('express');
const router = express.Router();
const cors = require('cors');
const { Op } = require('sequelize');

const Schedule = require('../models/schedule');
const ProSchedule = require('../models/mtm/productSchedule');
const AdjustTime = require('../middleware/adjustTime');

router.use(cors());

router.post('/register', AdjustTime, async (req, res) => {
  try {
    const result = await Schedule.create({
      ScheduledDay: req.body.ScheduledDay,
      ScheduledHour: req.body.ScheduledHour,
      ClientName: req.body.ClientName,
      userId: req.body.userId,
    });
    if (result) {
      for (var x = 0; x < req.body.ProSerId.length; x++) {
        const resp = await ProSchedule.create({
          ScheduleId: result.id,
          ProSerId: req.body.ProSerId[x],
        });
        if (!resp) {
          res
            .status(200)
            .send({ Error: 'Não foi possível criar o agendamento' });
        }
      }

      res.status(200).send({ message: 'Agendamento criado com sucesso' });
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({ Error: 'Não foi possível criar o agendamento' });
  }
});

router.post('/getOne', async (req, res) => {
  try {
    const result = await Schedule.findOne({
      where: {
        [Op.and]: [
          { ScheduledDay: req.body.ScheduledDay },
          { ScheduledHour: req.body.ScheduledHour },
          { userId: req.body.userId },
        ],
      },
    });
    if (result) {
      const Data = result.dataValues;
      const resp = await ProSchedule.findAll({
        where: {
          ScheduleId: Data.id,
        },
      });
      if (resp) {
        const Data2 = resp.map(function (item) {
          let ScheduleId = item.ScheduleId,
            ProSerId = item.ProSerId;

          return { ScheduleId, ProSerId };
        });
        var end =
          '[' +
          JSON.stringify(Data) +
          ',{"' +
          Data.id +
          '":' +
          JSON.stringify(Data2) +
          '}]';

        var DataEnd = JSON.parse(end);

        res.json(DataEnd);
      }
    } else {
      res.status(200).send({
        message: 'Não foi possível encontrar registros para este horário',
      });
    }
  } catch (err) {
    res.status(400).send({ Error: 'Não foi possível obter os dados' });
  }
});

router.post('/getAllFromDay', async (req, res) => {
  try {
    const result = await Schedule.findAll({
      where: {
        [Op.and]: [
          { ScheduledDay: req.body.ScheduledDay },
          { userId: req.body.userId },
        ],
      },
      raw: true,
    });
    if (result) {
      const Data = result.map(function (item) {
        let id = item.id,
          ScheduledDay = item.ScheduledDay,
          ScheduledHour = item.ScheduledHour,
          ClientName = item.ClientName;
        return { id, ScheduledDay, ScheduledHour, ClientName };
      });

      var obj = {};
      for (var x = 0; x < Data.length; x++) {
        const resp = await ProSchedule.findAll({
          where: {
            ScheduleId: Data[x].id,
          },
        });
        if (resp) {
          let RightID;
          const Data2 = resp.map(function (item) {
            let ScheduleId = item.ScheduleId,
              ProSerId = item.ProSerId;

            RightID = ScheduleId;

            return { ScheduleId, ProSerId };
          });

          obj[RightID] = Data2;
        }
      }

      var end = Data.concat(obj);

      res.json(end);
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({ Error: 'Não foi possível obter os dados' });
  }
});

router.post('/delete/One', async (req, res) => {
  try {
    const find = await Schedule.findOne({
      where: {
        [Op.and]: [
          { ScheduledDay: req.body.ScheduledDay },
          { ScheduledHour: req.body.ScheduledHour },
          { userId: req.body.userId },
        ],
      },
    });
    if (find) {
      await ProSchedule.destroy({
        where: { ScheduleId: find.id },
      });

      const del = await Schedule.destroy({
        where: { id: find.id },
      });
      if (del) {
        res.status(200).send({ message: 'Agendamento excluído com sucesso' });
      } else {
        res
          .status(200)
          .send({ Error: 'Não foi possível excluir o agendamento' });
      }
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({ Error: 'Não foi possível excluir o agendamento' });
  }
});

router.delete('/delete/EntireDay', async (req, res) => {
  try {
    const find = await Schedule.findAll({
      where: {
        [Op.and]: [
          { ScheduledDay: req.body.ScheduledDay },
          { userId: req.body.userId },
        ],
      },
      raw: true,
    });

    if (find) {
      const data = await find.map(function (item) {
        return item.id;
      });
      for (var x = 0; x < data.length; x++) {
        await ProSchedule.destroy({
          where: { ScheduleId: data[x] },
        });
      }
      const del = await Schedule.destroy({
        where: {
          [Op.and]: [
            { ScheduledDay: req.body.ScheduledDay },
            { userId: req.body.userId },
          ],
        },
      });
      if (del) {
        res.status(200).send({ message: 'Registros excluídos com sucesso' });
      } else {
        res
          .status(200)
          .send({ message: 'Não foi possível excluir os registros' });
      }
    }
  } catch (err) {
    res.status(400).send({ Error: 'Não foi possível excluir os registros' });
  }
});

router.put('/update', AdjustTime, async (req, res) => {
  try {
    const result = await Schedule.findOne({
      where: {
        [Op.and]: [{ id: req.body.id }, { userId: req.body.userId }],
      },
    });
    if (result) {
      const Types = '{"type":["ScheduledDay","ScheduledHour","ClientName"]}';
      const obj = JSON.parse(Types);
      var notFound = '';

      if (
        (req.body.ProSerIdToChange != '', req.body.ProSerIdToChange != null)
      ) {
        const resp = await ProSchedule.findOne({
          where: {
            [Op.and]: [
              { ScheduleId: result.id },
              { ProSerId: req.body.ProSerIdToChange },
            ],
          },
        });
        if (resp) {
          if (req.body.ProSerIdNew == '' || req.body.ProSerIdNew == null) {
            notFound = ' Produto selecionado, porém não encontrado';
          } else {
            resp.ProSerId = req.body.ProSerIdNew;
            await resp.save();
          }
        }
      }

      for (var x = 0; x < obj.type.length; x++) {
        var string = obj.type[x];
        if (req.body[string] != '') {
          result[string] = req.body[string];
          await result.save();
        }
      }
      res
        .status(200)
        .send({ message: 'Valores alterados com sucesso' + notFound });
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({ Error: 'Não foi possível atualizar o agendamento' });
  }
});

module.exports = (app) => app.use('/schedule', router);
