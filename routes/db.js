const mysql = require('mysql');
const configData = require('../config.json');

const db = mysql.createConnection({
  host: 'localhost',
  user: configData.host_name,
  password: configData.host_password,
  database: configData.host_db
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

module.exports = db;