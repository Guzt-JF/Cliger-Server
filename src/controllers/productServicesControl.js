const express = require('express');
const router = express.Router();
const cors = require('cors');
const { Op } = require('sequelize');

const ProSer = require('../models/product');
const ProductSales = require('../models/mtm/productSales');
const ProductSchedule = require('../models/mtm/productSchedule');

router.use(cors());

router.post('/New', async (req, res) => {
  try {
    const result = await ProSer.create({
      Code: req.body.Code,
      Name: req.body.Name,
      Description: req.body.Description,
      Type: req.body.Type,
      Value: req.body.Value,
      TotalAmount: req.body.TotalAmount,
      UnitCost: req.body.UnitCost,
      userId: req.body.userId,
    });
    if (result) {
      res.status(200).send({ message: 'Produto gravado com sucesso' });
    }
  } catch (err) {
    res.status(400).send({
      error: "Não foi possível registrar o produto, verifique se todos os campos estão preenchidos",
    });
  }
});

router.post('/GetAll', async (req, res) => {
  try {
    const result = await ProSer.findAll({
      where: {
        userId: req.body.userId,
      },
      raw: true,
    });
    if (result) {
      if (Object.values(result).length == 0) {
        res.status(404).send({ message: 'Produto não encontrado' });
      } else {
        const data = result.map(function (item) {
          let id = item.id,
            Code = item.Code,
            Name = item.Name,
            Description = item.Description,
            Type = item.Type,
            Value = item.Value,
            TotalAmount = item.TotalAmount,
            UnitCost = item.UnitCost,
            userId = item.userId;

          return {
            id,
            Code,
            Name,
            Description,
            Type,
            Value,
            TotalAmount,
            UnitCost,
            userId,
          };
        });
        res.status(200).send(data);
      }
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({ error: err });
  }
});

router.post('/GetOne', async (req, res) => {
  try {
    const result = await ProSer.findOne({
      where: {
        [Op.and]: [{ userId: req.body.userId }, { Name: req.body.Name }],
      },
    });
    if (result) {
      res.status(200).send(result);
    }
  } catch (err) {
    res.status(400).send({ error: "Não foi possível obter os dados" });
  }
});

router.post('/Update', async (req, res) => {
  try {
    const result = await ProSer.findOne({
      where: {
        [Op.and]: [{ id: req.body.id }, { userId: req.body.userId }],
      },
    });
    if (result) {
      const obj = {
        vars: ["Code", "Name", "Description", "Type", "Value", "TotalAmount", "UnitCost"]
      };

      for (var x = 0; x < obj.vars.length; x++) {
        const str = obj.vars[x];
        if (req.body[str] == '' || req.body[str] == null) {
          null;
        } else {
          result[str] = req.body[str];
          await result.save();
        }
      }

      res.status(200).send({ message: 'Valores alterados com sucesso' });
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({ error: "Não foi possível atualizar o produto/serviço" });
  }
});

router.post('/deleteOne', async (req, res) => {
  try {
    await ProductSales.destroy({
      where: {
        ProductId: req.body.DeleteId,
      },
    });
    await ProductSchedule.destroy({
      where: {
        ProSerId: req.body.DeleteId,
      },
    });
    await ProSer.destroy({
      where: {
        [Op.and]: [{ id: req.body.DeleteId }, { userId: req.body.userId }],
      },
    });

    res.status(200).send({ message: 'Produto/Serviço excluído com sucesso' });
  } catch (err) {
    // console.error(err)
    res.status(400).send({ error: "Não foi possível excluir o produto/serviço" });
  }
});

module.exports = (app) => app.use('/products', router);
