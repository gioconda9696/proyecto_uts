const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const { app, connection } = require('./app.js');

const NombreTabla = "sfvo2";
const NombreExcel = "SFVO2";

app.get('/sfvo2', (req, res) => {
    connection.query(`SELECT Voltaje , Corriente , Hora, fecha FROM ${NombreTabla} ORDER BY Datoid DESC LIMIT 150`, (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }

        // Formatear la fecha antes de enviarla al cliente
        const formattedResults = results.map(entry => ({
            ...entry,
            fecha: entry.fecha.toISOString().split('T')[0]  // Extrae solo la parte de la fecha
        }));

        res.json(formattedResults);
    });
});


app.get('/sfvo2_5min', (req, res) => {
    connection.query(`SELECT * FROM ${NombreTabla} ORDER BY Datoid DESC LIMIT 1`, (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }
        res.json(results[0]);
    });
});

app.get('/sfvo2_ultimosdatos', (req, res) => {
    connection.query(`SELECT * FROM ${NombreTabla} ORDER BY Datoid DESC LIMIT 11`, (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error de servidor');
        }

        // Formatear la fecha y calcular las diferencias
        const dataWithDifferences = results.map((data, index) => {
            // Formatear la fecha
            const formattedDate = data.fecha.toISOString().split('T')[0];

            if (index === results.length - 1) {
                return { 
                    ...data, 
                    fecha: formattedDate, // Usar la fecha formateada
                    VoltajeDiferencia: 0, 
                    CorrienteDiferencia: 0
                };
            } else {
                const voltajeDiferencia = data.Voltaje - results[index + 1].Voltaje;
                const corrienteDiferencia = data.Corriente - results[index + 1].Corriente;
                return { 
                    ...data, 
                    fecha: formattedDate, // Usar la fecha formateada
                    VoltajeDiferencia: voltajeDiferencia, 
                    CorrienteDiferencia: corrienteDiferencia
                };
            }
        });

        res.json(dataWithDifferences);
    });
});

app.get('/sfvo2_exportarexcel', (req, res) => {
    connection.query(`SELECT Voltaje, Corriente, Hora, fecha FROM ${NombreTabla}`, async (error, results) => {
        if (error) {
            console.error('Error al obtener los datos de la base de datos:', error);
            res.status(500).send('Error al obtener los datos de la base de datos');
            return;
        }

        try {
            // Formatear las fechas
            const formattedResults = results.map(entry => ({
                ...entry,
                fecha: entry.fecha ? entry.fecha.toISOString().split('T')[0] : null // Verificar si fecha no es null
            }));

            // Crear un nuevo archivo Excel
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(NombreExcel);

            // Verificar si hay resultados de la consulta
            if (formattedResults.length > 0) {
                // Mapear los resultados para obtener solo los valores (filas)
                const rows = formattedResults.map(result => Object.values(result));
                
                // Agregar los encabezados de las columnas
                const columnHeaders = Object.keys(formattedResults[0]);
                worksheet.addRow(columnHeaders);

                // Agregar las filas de datos al archivo Excel
                rows.forEach(row => {
                    worksheet.addRow(row);
                });

                // Generar el archivo Excel en un buffer
                const buffer = await workbook.xlsx.writeBuffer();

                // Consulta para obtener los correos electrónicos de la tabla 'destinatarios'
                connection.query('SELECT user FROM users', async (error, destinatarios) => {
                    if (error) {
                        console.error('Error al obtener los destinatarios de correo de la base de datos:', error);
                        res.status(500).send('Error al obtener los destinatarios de correo de la base de datos');
                        return;
                    }

                    try {
                        if (destinatarios.length > 0) {
                            // Construir la lista de destinatarios
                            const destinatariosList = destinatarios.map(destinatario => destinatario.user).join(',');
                            // Configurar nodemailer para enviar el correo electrónico
                            const transporter = nodemailer.createTransport({
                                service: 'Gmail',
                                auth: {
                                    user: 'proyectotelecomunicacionesuts@gmail.com',
                                    pass: 'xxqe hzlo djkp jzsc'
                                }
                            });
            
                            // Adjuntar el archivo Excel al correo electrónico
                            const mailOptions = {
                                from: 'proyectotelecomunicacionesuts@gmail.com',
                                to: destinatariosList,
                                subject: 'Archivo Excel de datos actuales en el SFVO2',
                                text: 'Se adjunta el archivo Excel con los datos actuales en el SFVO2.',
                                attachments: [{
                                    filename: `${NombreExcel}.xlsx`,
                                    content: buffer
                                }]
                            };

                            // Enviar el correo electrónico
                            const info = await transporter.sendMail(mailOptions);
                            console.log('Correo electrónico enviado: ' + info.response);
                            res.send('Correo electrónico enviado correctamente');
                        } else {
                            console.error('No hay destinatarios de correo en la base de datos');
                            res.status(500).send('No hay destinatarios de correo en la base de datos');
                        }
                    } catch (error) {
                        console.error('Error al enviar el correo electrónico:', error);
                        res.status(500).send('Error al enviar el correo electrónico');
                    }
                });
            } else {
                console.error('La consulta no devolvió resultados');
                res.status(500).send('La consulta no devolvió resultados');
            }
        } catch (err) {
            console.error('Error al procesar los datos:', err);
            res.status(500).send('Error al procesar los datos');
        }
    });
});

// Función para exportar los datos y enviar el correo electrónico
async function exportAndEmailData() {
    try {
        const results = await queryDatabase(`SELECT Voltaje, Corriente, Hora, fecha FROM ${NombreTabla}`);
        const destinatarios = await queryDatabase('SELECT user FROM users');

        if (results.length > 0 && destinatarios.length > 0) {
            // Formatear las fechas
            const formattedResults = results.map(entry => ({
                ...entry,
                fecha: entry.fecha ? entry.fecha.toISOString().split('T')[0] : null // Verificar si fecha no es null
            }));

            // Crear el archivo Excel y configurar el transporte del correo
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(NombreExcel);
            const rows = formattedResults.map(result => Object.values(result));
            const columnHeaders = Object.keys(formattedResults[0]);
            worksheet.addRow(columnHeaders);

            rows.forEach(row => {
                worksheet.addRow(row);
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'proyectotelecomunicacionesuts@gmail.com',
                    pass: 'xxqe hzlo djkp jzsc'
                }
            });

            // Construir la lista de destinatarios
            const destinatariosList = destinatarios.map(destinatario => destinatario.user).join(',');

            // Configurar las opciones del correo electrónico
            const mailOptions = {
                from: 'proyectotelecomunicacionesuts@gmail.com',
                to: destinatariosList,
                subject: 'Base de Datos exportada de el SFVO2',
                text: 'Estos son los datos tomados dentro de los 15 días de el SFVO2',
                attachments: [{
                    filename: `${NombreExcel}_15dias.xlsx`,
                    content: buffer
                }]
            };

            // Enviar el correo electrónico
            const info = await transporter.sendMail(mailOptions);
            console.log('Correo electrónico enviado: ' + info.response);
            return;
        } else {
            console.error('La consulta no devolvió resultados o no hay destinatarios de correo.');
            return;
        }
    } catch (error) {
        console.error('Error:', error);
        return;
    }
}

// Función para ejecutar una consulta a la base de datos
function queryDatabase(sql) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

async function performExecutionIfNeeded() {
    const now = new Date();
    if (now.getDate() === 15 || now.getDate() === 30) { // Si es el 15 o el 30
    await exportAndEmailData(); // Ejecuta la tarea
    }
    if (now.getDate() === 30) {
    // Borrar los datos de la tabla 'datos' después de enviar el correo
    await queryDatabase(`TRUNCATE TABLE ${NombreTabla}`);
    console.log('Datos borrados correctamente de la tabla.'); 
    }
    scheduleNextExecution(); // Programa la próxima ejecución
}

function scheduleNextExecution() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Obtén la fecha de mañana
    const timeUntilTomorrow = tomorrow.getTime() - now.getTime(); // Calcula el tiempo hasta mañana
    setTimeout(performExecutionIfNeeded, timeUntilTomorrow+60000); // Programa el temporizador para mañana
}

scheduleNextExecution(); // Programa la próxima ejecución
