'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename); 

// ✅ USAR LA MISMA INSTANCIA DE SEQUELIZE QUE database.js
const { sequelize } = require('../src/config/database');

const db = {};

console.log('🔄 models/index.js: Usando instancia de sequelize desde database.js');

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const modelDef = require(path.join(__dirname, file));
    const model = typeof modelDef === 'function' ? modelDef(sequelize, Sequelize.DataTypes) : modelDef;
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log('✅ models/index.js: Modelos cargados con sequelize unificado');
console.log('📊 Modelos disponibles:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));

module.exports = db;
