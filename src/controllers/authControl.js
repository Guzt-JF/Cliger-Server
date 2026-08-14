/* eslint-disable no-console */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

require('dotenv-safe').config();

const User = require('../models/user');
const Product = require('../models/product');
const ProductSales = require('../models/mtm/productSales');
const productSchedule = require('../models/mtm/productSchedule');

const GenerateConfirmToken = require('../utils/generateToken');
const transporter = require('../modules/mail');
const emailFilter = require('../middleware/filter');
const generatePreLoadToken = require('../utils/generatePreLoadToken');

router.use(cors());

router.post('/register', emailFilter, async (req, res) => {
  try {
    if (process.env.STAGE === 'demo') {
      res.status(200).send({
        Error: 'Cadastro Não permitido em demonstração',
      });
      return;
    }
    const Token = generatePreLoadToken();
    bcrypt.hash(req.body.Password, 10, async (err, hash) => {
      const result = await User.create({
        UserName: req.body.UserName,
        Email: req.body.Email,
        Password: hash,
        BirthDate: req.body.BirthDate,
        PhoneNumber: req.body.PhoneNumber,
        ResetToken: null,
        ConfirmToken: Token,
      });
      if (result) {
        res.status(200).send({
          message: 'Cadastro bem-sucedido',
          ConfirmToken: Token,
          Id: result.id,
        });
      }
    });
  } catch (err) {
    res.status(400).send({ Error: 'Cadastro mal-sucedido' });
  }
});

router.post('/authenticate', async (req, res) => {
  try {
    let Email = req.body.Email;
    if (process.env.STAGE === 'demo' && Email !== 'mail@test.com') {
      res.status(200).send({ Error: 'E-Mail não permitido em demonstração' });
      return;
    }

    const result = await User.findOne({
      where: { Email },
    });
    if (result) {
      bcrypt.compare(req.body.Password, result.Password, async (err, resp) => {
        if (resp) {
          res.status(200).send({
            message: 'Sucesso no Login',
            id: result.id,
            UserName: result.UserName,
            Email: result.Email,
            BirthDate: result.BirthDate,
            PhoneNumber: result.PhoneNumber,
            ConfirmToken: result.ConfirmToken,
          });
        } else {
          res.status(200).send({ Error: 'Senha Errada' });
        }
      });
    } else {
      res.status(200).send({ Error: 'E-Mail Errado' });
    }
  } catch (err) {
    console.error(err);
    res.status(400).send({ Error: 'Autenticação falha' });
  }
});

router.post('/GetUserByToken', async (req, res) => {
  try {
    jwt.verify(req.body.ConfirmToken, process.env.SECRET, async (err) => {
      if (err) {
        const result = await User.findOne({
          where: {
            ConfirmToken: req.body.ConfirmToken,
          },
        });
        if (result) {
          result.ConfirmToken = generatePreLoadToken();
          await result.save();
        }
        res.status(200).send({ Error: 'Token inválido' });
        return;
      }

      const result = await User.findOne({
        where: {
          ConfirmToken: req.body.ConfirmToken,
        },
      });
      if (result) {
        if (
          process.env.STAGE === 'demo' &&
          result.Email !== 'test-mail@mail.com'
        ) {
          res
            .status(200)
            .send({ Error: 'usuário não permitido em demonstração' });
        }

        res.status(200).send({
          message: 'Sucesso no Login',
          id: result.id,
          UserName: result.UserName,
          Email: result.Email,
          BirthDate: result.BirthDate,
          PhoneNumber: result.PhoneNumber,
        });
      }
    });
  } catch (err) {
    // console.error(err)
    res.status(400).send({ Error: 'Não encontrado' });
  }
});

router.post('/delete/User', async (req, res) => {
  try {
    if (process.env.STAGE === 'demo') {
      res.status(200).send({
        Error: 'Não é permitido deletar em demonstração',
      });
      return;
    }

    const result = await User.findOne({
      where: {
        id: req.body.id,
      },
    });
    if (result) {
      const findPro = await Product.findAll({
        where: { userId: result.id },
      });
      if (findPro) {
        for (var x = 0; x < findPro.length; x++) {
          await ProductSales.destroy({
            where: { ProductId: findPro[x].id },
          });
          await productSchedule.destroy({
            where: { ProSerId: findPro[x].id },
          });
        }
      }
      await User.destroy({
        where: {
          id: result.id,
        },
      });
      res.status(200).send({ message: 'Usuário deletado' });
    } else {
      res.status(200).send({ Error: 'Email Errado' });
    }
  } catch (err) {
    res.status(400).send({ Error: 'Falha na operação' });
  }
});

router.put('/update', async (req, res) => {
  try {
    if (process.env.STAGE === 'demo') {
      res.status(200).send({
        Error: 'Não é permitido atualizar em demonstração',
      });
      return;
    }
    const result = await User.findOne({
      where: {
        id: req.body.id,
      },
    });
    if (result) {
      const json = '{"User":["UserName","BirthDate","PhoneNumber"]}';
      const obj = JSON.parse(json);

      for (var x = 0; x < obj.User.length; x++) {
        var string = obj.User[x];
        if (req.body[string] != '') {
          result[string] = req.body[string];
          await result.save();
        }
        res.status(200).send({ message: 'Valores Atualizados' });
      }
    }
  } catch (err) {
    res.status(400).send({ Error: 'Atualização falha' });
  }
});

router.post('/forgotPass', async (req, res) => {
  try {
    let Token = GenerateConfirmToken();

    if (
      !process.env.OAUTH_CLIENTID ||
      !process.env.OAUTH_CLIENT_SECRET ||
      !process.env.OAUTH_REFRESH_TOKEN ||
      !process.env.MAILPASS
    ) {
      res
        .status(200)
        .send({ Error: 'Configurações de email não configuradas' });
      return;
    }

    const result = await User.findOne({
      where: {
        Email: req.body.Email,
      },
    });
    if (!result) {
      res.status(200).send({ Error: 'Email Não existe' });
      return;
    }

    bcrypt.hash(Token, 10, async (err, hash) => {
      result.ResetToken = hash;
      await result.save();
    });

    const message = {
      from: '<cligeroficial@gmail.com>',
      to: `<${req.body.Email}>`,
      subject: 'Recuperação de senha',
      html: `
			<body style="background-color:#68293f;">
				<img src="https://i.ibb.co/SBSS0JF/Cliger-Logo-Text-Only.png" alt="Cliger-Logo"/>
				<h2 style="color:#ebb89b">
					Olá, pelo visto você gostaria de mudar a sua senha, use esse código aqui para redefinir sua senha
				</h2>
					<h1 style="color:#ebb89b">${Token}</h1>
				<h2 style="color:#ebb89b">
					Caso você não queira mudar a senha apenas ignore este e-mail
				</h2>
			<body>`,
    };
    console.log('\nEnviando o Email');
    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log(`Error occurred. ${err.message}`);
        res.status(200).send({ Error: 'Email não Enviado' });
      } else {
        console.log(`Message sent:, ${info.messageId}`);
        res.status(200).send({ message: 'Email Enviado' });
      }
    });
  } catch (err) {
    // console.error(err)
    res.status(400).send({ Error: 'Email não Enviado' });
  }
});

router.post('/ConfirmToken', async (req, res) => {
  try {
    const result = await User.findOne({
      where: {
        Email: req.body.Email,
      },
    });
    if (result) {
      bcrypt.compare(req.body.Token, result.ResetToken, async (err, resp) => {
        if (resp) {
          res.status(200).send({ message: 'Código confirmado' });
        } else if (err) {
          // console.error(err)
          res.status(200).send({ Error: 'Código Invalido' });
        } else {
          res.status(200).send({ Error: 'Código Errado' });
        }
      });
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({
      Error: 'Não foi possivel confirmar o código, tente novamente mais tarde',
    });
  }
});

router.post('/ChangePass', async (req, res) => {
  try {
    if (process.env.STAGE === 'demo') {
      res.status(200).send({
        Error: 'Não é permitido alterar a senha em demonstração',
      });
      return;
    }
    const result = await User.findOne({
      where: {
        Email: req.body.Email,
      },
    });
    if (result) {
      bcrypt.compare(req.body.Token, result.ResetToken, async (err, resp) => {
        if (resp) {
          bcrypt.hash(req.body.Password, 10, async (err, hash) => {
            (result.Password = hash), (result.ResetToken = '');
            await result.save();
            res.status(200).send({ message: 'Senha Alterada com Sucesso' });
          });
        }
      });
    } else {
      res.status(200).send({ Error: 'Email ou Token é inválido' });
    }
  } catch (err) {
    // console.error(err)
    res.status(400).send({ Error: 'Não foi possível alterar a senha' });
  }
});

module.exports = (app) => app.use('/auth', router);
