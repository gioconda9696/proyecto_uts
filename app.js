const express = require('express');
const mysql = require('mysql');
const cors = require('fs');
const https = require('https');
const app = express();
const PORT = 2001;
const db = require('./db');

app.use(cors({
    origin: ['https://monitoreotelecoproyectouts.com', 'https://monitoreotelecoproyectouts.com:3000','http://monitoreotelecoproyectouts.com', 'http://monitoreotelecoproyectouts.com:3000'
        ,'https://monitoreotelecoproyectouts.com/login'
        ,'https://www.monitoreotelecoproyectouts.com'
        ,'http://localhost:3000'
        ,'http://192.168.105.215:3001'] // Ajusta según sea necesario
}));
app.use(express.json());

module.exports = { app, db };
require('./sfvo1.js');
require('./sfvo2.js');

// Ruta para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente');
});

// Ruta API para obtener usuarios
app.get('/usuarios', (req, res) => {
    const dbInstance = db.getInstance();
    dbInstance.connect();
    dbInstance.connection.query('SELECT * FROM users', (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }
        res.json(results);
        dbInstance.disconnect();
    });
});

// Ruta API para crear un usuario
app.post('/usuarios', (req, res) => {
    const { user, password } = req.body;
    const dbInstance = db.getInstance();
    dbInstance.connect();
    dbInstance.connection.query('INSERT INTO users (user, password) VALUES (?, ?)', [user, password], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }
        res.json({ message: 'Usuario creado correctamente' });
        dbInstance.disconnect();
    });
});

// Ruta API para actualizar un usuario
app.put('/usuarios/:id', (req, res) => {
    const { user, password } = req.body;
    const userId = req.params.id;
    const dbInstance = db.getInstance();
    dbInstance.connect();
    dbInstance.connection.query('UPDATE users SET user=?, password=? WHERE Userid=?', [user, password, userId], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }
        res.json({ message: 'Usuario actualizado correctamente' });
        dbInstance.disconnect();
    });
});

// Ruta API para eliminar un usuario
app.delete('/usuarios/:id', (req, res) => {
    const userId = req.params.id;
    const dbInstance = db.getInstance();
    dbInstance.connect();
    dbInstance.connection.query('DELETE FROM users WHERE Userid=?', [userId], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }
        res.json({ message: 'Usuario eliminado correctamente' });
        dbInstance.disconnect();
    });
});

// Ruta API para iniciar sesión
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const dbInstance = db.getInstance();
    dbInstance.connect();
    dbInstance.connection.query('SELECT * FROM users WHERE user = ? AND password = ?', [username, password], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).json({ success: false, message: 'Error de servidor' });
        }

        if (results.length > 0) {
            res.json({ success: true, message: 'Inicio de sesión exitoso' });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
        dbInstance.disconnect();
    });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
