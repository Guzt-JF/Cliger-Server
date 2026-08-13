const express = require('express');
const router = express.Router();
const cors = require('cors');

const SalesRecord = require('../models/salesRecord');
const ProductSales = require('../models/mtm/productSales');

router.use(cors());

router.post('/newRecord', async (req, res) => {
  try {
    const result = await SalesRecord.create({
      TotalCost: req.body.TotalCost,
      MoneyPayed: req.body.MoneyPayed,
      PayBack: req.body.PayBack,
      userId: req.body.userId,
    });
    if (result) {
      for (var x = 0; x < req.body.ProductId.length; x++) {
        await ProductSales.create({
          ProductId: req.body.ProductId[x],
          SalesId: result.id,
          Amount: req.body.Amount[x],
          Weight: req.body.Weight[x],
        });
      }
      res.status(200).send({ message: 'Sucesso ao registrar venda' });
    }
  } catch (err) {
    res.status(400).send({ error: 'Não foi possível registrar a venda' });
  }
});

router.post('/GetAll', async (req, res) => {
  try {
    const result = await SalesRecord.findAll({
      where: {
        userId: req.body.userId,
      },
    });
    if (result) {
      const Data = result.map(function (item) {
        const Created = item.createdAt;
        let FormattedDate =
          Created.getFullYear() +
          '-' +
          ('0' + (Created.getMonth() + 1)).slice(-2) +
          '-' +
          ('0' + Created.getDate()).slice(-2);
        let TotalCost = item.TotalCost,
          MoneyPayed = item.MoneyPayed,
          PayBack = item.PayBack,
          id = item.id,
          createdAt = FormattedDate;

        return { id, TotalCost, MoneyPayed, PayBack, createdAt };
      });

      const FinalData = await Promise.all(
        Data.map(async (currentData) => {
          const productSales = await ProductSales.findAll({
            where: {
              SalesId: currentData.id,
            },
          });
          if (productSales) {
            const proAmount = productSales.reduce((acc, current) => {
              return acc + current.Amount;
            }, 0);
            return { ...currentData, Amount: proAmount };
          }
          return { ...currentData };
        })
      );

      res.status(200).send(FinalData);
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({ error: "Não foi possível obter os dados" });
  }
});

router.post('/GetOneProduct', async (req, res) => {
  try {
    const result = await SalesRecord.findAll({
      where: {
        userId: req.body.userId,
      },
    });
    if (result) {
      const resp = await ProductSales.findAll({
        where: {
          ProductId: req.body.ProductId,
        },
      });
      if (resp) {
        const Data = resp.map(function (item) {
          let FormattedDate =
            item.createdAt.getFullYear() +
            '/' +
            (item.createdAt.getMonth() + 1) +
            '/' +
            item.createdAt.getDate();
          let SalesId = item.SalesId,
            ProductId = item.ProductId,
            Amount = item.Amount,
            Weight = item.Weight,
            createdAt = FormattedDate;

          return { SalesId, ProductId, Amount, Weight, createdAt };
        });
        res.status(200).send(Data);
      }
    } else {
      res.status(404).send({ error: 'Não encontrado' });
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({ error: "Não foi possível obter os dados" });
  }
});

module.exports = (app) => app.use('/SalesRecord', router);
