const mysql = require('mysql')

var connection = mysql.createConnection({
  // host 바꾸기
  host: '',
  port: 3306,
  user: '',
  password: '',
  database: '',
})

connection.connect(function (err) {
  if (err) throw err
  console.log('Connected!')
})

module.exports = connection
