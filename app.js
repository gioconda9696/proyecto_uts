const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
//add 10/06/2024
const db = require('./db');

const app = express();
const PORT = 2001;


const connection = mysql.createConnection({
    host: '162.240.158.67',
    user: 'wwmoni_uts',
    password: 'Dios2024.',
    database: 'wwmoni_uts'
});

connection.connect((error) => {
    if (error) {
        console.error('Error al conectar a la base de datos:', error);
        return;
    }
    console.log('Conexi�n exitosa a la base de datos');
});

app.use(cors({
    origin: ['*'] // Ajusta seg�n sea necesario
}));
app.use(express.json());

module.exports = { app, connection };
require('./sfvo1.js');
require('./sfvo2.js');

// Ruta para verificar que el servidor est� funcionando
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

// Rutas API
app.get('/usuarios', (req, res) => {
    connection.query('SELECT * FROM users', (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }
        res.json(results);
    });
});

app.post('/usuarios', (req, res) => {
    const { user, password } = req.body;
    connection.query('INSERT INTO users (user, password) VALUES (?, ?)', [user, password], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }
        res.json({ message: 'Usuario creado correctamente' });
    });
});

app.put('/usuarios/:id', (req, res) => {
    const { user, password } = req.body;
    const userId = req.params.id;
    connection.query('UPDATE users SET user=?, password=? WHERE Userid=?', [user, password, userId], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }
        res.json({ message: 'Usuario actualizado correctamente' });
    });
});

app.delete('/usuarios/:id', (req, res) => {
    const userId = req.params.id;
    connection.query('DELETE FROM users WHERE Userid=?', [userId], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }
        res.json({ message: 'Usuario eliminado correctamente' });
    });
});

// Ruta API para iniciar sesión
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  connection.query('SELECT * FROM users WHERE user = ? AND password = ?', [username, password], (error, results, fields) => {
    if (error) {
      console.error('Error al ejecutar la consulta:', error);
      return res.status(500).json({ success: false, message: 'Error de conexión con la base de datos' });
    }

    if (results.length > 0) {
      res.json({ success: true, message: 'Inicio de sesión exitoso' });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
  });
});



app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
