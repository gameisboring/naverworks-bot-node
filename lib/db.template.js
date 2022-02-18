const mysql = require('mysql2/promise')
let connection = mysql
  .createConnection({
    // host 바꾸기
    host: 'DB_HOST',
    user: 'DB_USER',
    port: 3306,
    password: 'DB_PASSWORD',
    database: 'DB_DATABASE',
  })
  .catch((err) => {
    console.error(`Database connection error (db.js): ${err.message}`)
  })
module.exports = connection
