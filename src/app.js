// src/app.js
const express = require('express');
const frases = require('./frases');

const app = express();

app.use(express.json());
app.use('/api/frases-motivacion', async (req, res) => {
    try {
      res.json(frases);
      
    } catch (error) {
      console.error('Error al obtener frases:', error);
      res.status(500).json({ error: 'Error al obtener frases motivacionales' });
    }
  });
module.exports = app;
