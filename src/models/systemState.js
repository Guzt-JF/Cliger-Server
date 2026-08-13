const { DataTypes } = require('sequelize');
const Database = require('../config/database');

const SystemState = Database.define(
  'SystemState',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },

    lastRequest: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: 'systemState',
    timestamps: false,
  }
);

module.exports = SystemState;
