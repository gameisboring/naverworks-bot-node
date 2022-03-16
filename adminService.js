const pool = require('./lib/db')
pool.on('acquire', function (connection) {
  console.log(`커넥션 풀에서 ${connection.threadId} 번 커넥션 수령 (admin)`)
})

pool.on('connection', function (connection) {
  connection.query('SET SESSION auto_increment_increment=1')
})

pool.on('release', function (connection) {
  console.log(`커넥션 풀에 ${connection.threadId} 번 커넥션 반납 (admin)`)
})

const SQL_QUERY = {
  특정직원출퇴근시간UPDATE: `UPDATE io_status set _in = ?, _out= ?, lastupdate = _out, who = 'P'
    WHERE date_format(lastupdate,'%Y-%m-%d') = date_format(?,'%Y-%m-%d') and name = ?;`,
}

module.exports = class adminService {
  async _upUserIO(name, date, in_time, out_time) {
    const in_datetime = date + ' ' + in_time
    const out_datetime = date + ' ' + out_time

    const result = await pool.query(SQL_QUERY.특정직원출퇴근시간UPDATE, [
      in_datetime,
      out_datetime,
      date,
      name,
    ])
    if (result[0].affectedRows == 1) {
      console.log(
        `${name}님 ${in_datetime}부터 ${out_datetime}까지 근무시간 UPDATE 성공`
      )
    } else {
      console.log(`${name}님 근무시간 UPDATE 실패`)
    }
  }
}
