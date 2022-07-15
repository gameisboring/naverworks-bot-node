module.exports = class Query {
  updateOnlyOutTime = `UPDATE 'bt-at'.io_status 
                        SET who = 'P', _out= ?, now = 'OUT', lastupdate = _out 
                      WHERE (name = ?) 
                        AND DATE_FORMAT(lastupdate,'%Y-%m-%d') = DATE_FORMAT(?,'%Y-%m-%d')`

  updateOnlyInTime = `UPDATE 'bt-at'.io_status set who = 'P', _in = ?, now = 'OUT', lastupdate = _out WHERE (name = ?) and DATE_FORMAT(lastupdate,'%Y-%m-%d') = DATE_FORMAT(?,'%Y-%m-%d');`

  updateNowStatus = `UPDATE 'bt-at'.io_status set now = 'OUT' WHERE DATE_FORMAT(lastupdate,'%Y-%m-%d') = DATE_FORMAT(?,'%Y-%m-%d');`

  selectTodayWorkTime = `SELECT truncate(timestampdiff(minute,_in,_out) / 60,0) as worked_hour, timestampdiff(minute,_in,_out) % 60 as worked_minute, _in, _out FROM io_status WHERE mac = ? AND DATE_FORMAT(lastupdate,'%Y-%m-%d') = DATE_FORMAT(?,'%Y-%m-%d');`

  selectThisWeekWorkTime = `SELECT sec_to_time(SUM(TIMESTAMPDIFF(second,_in,if(now='IN',lastupdate,_out)))) AS 'worked_time' FROM io_status WHERE date(lastupdate) BETWEEN SUBDATE(DATE(DATE_ADD(NOW(),INTERVAL 8 HOUR)),DATE_FORMAT(DATE_ADD(NOW(),INTERVAL 8 HOUR), '%w')) AND SUBDATE(date(DATE_ADD(NOW(),INTERVAL 8 HOUR)),DATE_FORMAT(DATE_ADD(NOW(),INTERVAL 8 HOUR),'%w')-6) AND mac = ?;`

  selectThisMonthlyWorkTime = `SELECT sec_to_time(SUM(TIMESTAMPDIFF(second,_in,if(now='IN',lastupdate,_out)))) AS 'worked_time' FROM io_status where DATE_FORMAT(lastupdate,'%m') = DATE_FORMAT(DATE_ADD(NOW(),INTERVAL 8 HOUR), '%m') AND mac = ?;`

  selectLastMonthlyWorkTime = `SELECT sec_to_time(SUM(TIMESTAMPDIFF(second,_in,if(now='IN',lastupdate,_out))))  AS 'worked_time'
  FROM io_status where DATE_FORMAT(lastupdate,'%m') = DATE_FORMAT(LAST_DAY(NOW() - interval 1 month), '%m') 
  AND mac = ?;`

  selectQuaterWorkTime = `SELECT sec_to_time(SUM(TIMESTAMPDIFF(second,_in,if(now='IN',lastupdate,_out))))  AS 'worked_time' FROM io_status where quarter(lastupdate) = ? AND mac = ?;`

  checkNowStatus = `SELECT _in FROM io_status WHERE mac = ? AND DATE_FORMAT(lastupdate,'%Y-%m-%d') = DATE_FORMAT(?,'%Y-%m-%d');`

  updateOut = `UPDATE io_status SET _out = ? now = 'OUT', lastupdate = ? WHERE DATE_FORMAT(?,'%y-%m-%d') = DATE_FORMAT(lastupdate,'%y-%m-%d') AND mac = ?;`

  updateIn = `UPDATE io_status SET now = 'IN',lastupdate = ?,_in = ? WHERE DATE_FORMAT(?,'%y-%m-%d') = DATE_FORMAT(lastupdate,'%y-%m-%d') AND mac = ?;`
}
