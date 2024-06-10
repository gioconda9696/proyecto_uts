const mysql = require('mysql');

let connection;
let instance = null;
let connectionCounter = 0;

function createConnection() {
    connection = mysql.createConnection({
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
        console.log('Conexión exitosa a la base de datos');
    });
}

function getInstance() {
    if (!instance) {
        instance = {
            connection: null,
            connect: function () {
                if (connectionCounter === 0) {
                    createConnection();
                }
                this.connection = connection;
                connectionCounter++;
            },
            disconnect: function () {
                if (this.connection === connection && connectionCounter > 0) {
                    connectionCounter--;
                    if (connectionCounter === 0) {
                        connection.end();
                    }
                }
                this.connection = null;
            }
        };
    }
    return instance;
}

module.exports = {
    getInstance
};
