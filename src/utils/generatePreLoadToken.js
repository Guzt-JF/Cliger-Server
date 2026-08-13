const jwt = require('jsonwebtoken');
require('dotenv-safe').config();

function generatePreLoadToken (params = {}) {
  return jwt.sign(params, process.env.SECRET, {
    expiresIn: 60 * 60 * 24,
  });
}

module.exports = generatePreLoadToken;