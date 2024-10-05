// setup MySQL connection
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Apocalypse_07',
    database: 'crowdfunding_db'
  });

db.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

db.query('SELECT * FROM fundraiser', (err,rows) => {
    if(err) throw err;
    console.log('Data received from Db:');
    console.log(rows);
  });