const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
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
    origin: ['https://monitoreotelecoproyectouts.com', 'https://monitoreotelecoproyectouts.com:3000','http://monitoreotelecoproyectouts.com', 'http://monitoreotelecoproyectouts.com:3000'
        ,'https://monitoreotelecoproyectouts.com/login'
        ,'https://www.monitoreotelecoproyectouts.com'
        ,'http://localhost:3000'
        ,'http://192.168.105.215:3001'] // Ajusta seg�n sea necesario
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

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    connection.query('SELECT * FROM users WHERE user = ? AND password = ?', [username, password], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).json({ success: false, message: 'Error de servidor' });
        }

        if (results.length > 0) {
            res.json({ success: true, message: 'Inicio de sesi�n exitoso' });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales inv�lidas' });
        }
    });
});


app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
