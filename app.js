const express = require("express");
const mssql = require("mssql");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
const nodemailer = require("nodemailer");
const moment = require('moment');

// Configuración de la conexión a la base de datos
const dbConfig = {
  user: "user",
  password: "tp2_upc2023",
  server: "sv001.database.windows.net",
  database: "historicodelitos",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "jfpalomino.22@gmail.com",
    pass: "phlu psek ucsr gugv",
  },
});

function enviarNotificacionPorCorreo(correo) {
  const mailOptions = {
    from: "jfpalomino.22@gmail.com",
    to: correo.join(";"),
    subject: "Notificación de subida de archivo Excel",
    text: `Se ha subido nueva informacion`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo electrónico:", error);
    } else {
      console.log("Correo electrónico de notificación enviado:", info.response);
    }
  });
}

// Ruta para obtener datos de la base de datos
app.get("/datos", async (req, res) => {
  try {
    const pool = await mssql.connect(dbConfig);
    const result = await pool
      .request()
      .query("SELECT * FROM dbo.delitosNuevos");
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.post("/cargar-excel", async (req, res) => {
  const jsonData = req.body.jsonData; // Accede a jsonData desde el cuerpo de la solicitud
  const additionalData = req.body.additionalData;
  console.log("data")
  try {
    const insertPromises = jsonData.map(async (data, id) => {
      if (id > 0) {
        const pool = await mssql.connect(dbConfig);
        console.log(
          `INSERT INTO dbo.delitosNuevos (DescripcionDelito, FechaDelito, Direccion, Latitud, Longitud ) VALUES ('${data[0]}', '${moment(data[1]).format('D/M/YYYY HH:mm')}',  '${data[2]}', ${data[3]}, ${data[4]});`
        );
        const result = await pool
          .request()
          .query(
            `INSERT INTO dbo.delitosNuevos (DescripcionDelito, FechaDelito, Direccion, Latitud, Longitud ) VALUES ('${data[0]}', '${moment(data[1]).format('D/M/YYYY HH:mm')}', '${data[2]}', ${data[3]}, ${data[4]});`
          );
        return result.recordset;
      }
    });
    const insertedData = await Promise.all(insertPromises);
    res.status(200).json({
      message: "Registros del archivo CSV insertados en SQL Azure",
      insertedData: insertedData,
    });
    enviarNotificacionPorCorreo(additionalData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});
