const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const middleware = require('./middleware/dailyReset');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

if (process.env.STAGE === 'demo') {
  app.use(middleware);
}

require('./controllers/index')(app);

module.exports = app;
