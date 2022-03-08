const request = require('request')

const pool = require('./lib/db')

pool.on('acquire', function (connection) {
  console.log(`커넥션 풀에서 ${connection.threadId} 번 커넥션 수령`)
})

pool.on('connection', function (connection) {
  connection.query('SET SESSION auto_increment_increment=1')
})

pool.on('release', function (connection) {
  console.log(`커넥션 풀에 ${connection.threadId} 번 커넥션 반납`)
})

const USERS = require('./lib/user')
/**
 * 콜백 타입
 */
const CALL_BACK_TYPE = {
  /**
   * 봇이 받는 메시지
   */
  message: 'message',
  join: 'join',
  leave: 'leave',
  joined: 'joined',
  left: 'left',
  postback: 'postback',
}

/**
 * 콜백 콘텐츠 타입
 */
const CALL_BACK_MESSAGE_CONTENT_TYPE = {
  /**
   * 텍스트
   */
  text: 'text',
  /**
   * 경로
   */
  location: 'location',
  /**
   * 스탬프
   */
  sticker: 'sticker',
  /**
   * 이미지
   */
  image: 'image',
}

/**
 * MESSAGE_CONTENT_TYPE
 */
const MESSAGE_CONTENT_TYPE = {
  text: 'text',
  image: 'image',
  link: 'link',
  sticker: 'sticker',
  buttonTemplate: 'button_template',
  listTemplate: 'list_template',
  carousel: 'carousel',
  imageCarousel: 'image_carousel',
}

/**
 * BotMessageService클래스
 */
module.exports = class BotMessageService {
  /**
   * BotMessageService를 초기화 합니다.
   * @param {string} serverToken Server토큰
   */
  constructor(serverToken) {
    this._serverToken = serverToken
    this.imageIndex = 0
  }

  /**
   * NAVER WORKS 를 통해 Bot 메시지를 보냅니다.
   * @param {object} callbackEvent 요청 콜백 이벤트
   */
  async send(callbackEvent) {
    let res = new Promise((resolve, reject) => {
      resolve(this._getResponse(callbackEvent))
    })

    res.then((value) => {
      if (!value) {
        console.log('value is empty....')
        console.log(value)
        return
      } else {
        console.log('value is not empty!!!!')
        return new Promise((resolve, reject) => {
          // NAVER WORKS 에게 메시지 보내기 요청
          request.post(this._createMessage(value), (error, response, body) => {
            if (error) {
              console.log('BotService.send error')
              console.log(error)
            }
            resolve()
          })
        })
      }
    })
  }

  _createMessage(res) {
    return {
      url: `https://apis.worksmobile.com/r/${process.env.API_ID}/message/v1/bot/${process.env.BOT_NO}/message/push`,
      //url: `https://apis.worksmobile.com/${process.env.API_ID}/message/sendMessage/v2`,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        consumerKey: process.env.CONSUMER_KEY,
        Authorization: `Bearer ${this._serverToken}`,
      },
      json: res,
    }
  }

  /**
   * 멤버 ID 연결해서 반환
   * @param {Array} memberList
   * @return {string} 멤버 ID 목록 문자열
   */
  _buildMember(memberList) {
    let result = ''
    if (!memberList) return result
    memberList.forEach((m) => {
      if (result.length > 0) result += ','
      result += m
    })
    return result
  }

  /**
   * Bot 실작동부
   * @param {object} callbackEvent 요청 콜백 이벤트
   * @return {string} 리스폰스 메시지
   */
  async _getResponse(callbackEvent) {
    // first
    console.log(callbackEvent)

    // 리스폰스 객체 선언
    let res = {}

    if (callbackEvent.source.roomId) {
      // 수신한 데이터에 톡방 ID 가 있는 경우는, 리스폰스 목적지에 같은 톡방 ID 를 지정
      res.roomId = callbackEvent.source.roomId
    } else {
      // 톡방 아이디가 없을 경우 Bot과 사용자의 ID를 지정
      res.accountId = callbackEvent.source.accountId
    }

    // 봇이 사용자로부터 메세지를 전달받음
    if (callbackEvent.type === CALL_BACK_TYPE.message) {
      // 메시지의 타입은 텍스트임
      if (callbackEvent.content.type === CALL_BACK_MESSAGE_CONTENT_TYPE.text) {
        // 아이디 추상화
        const id = callbackEvent.source.accountId.split('@')
        //
        const callbackTime = this.getCallbackTime(
          new Date(callbackEvent.createdTime)
        )
        const callbackDate = this.getCallbackDate(
          new Date(callbackEvent.createdTime)
        )

        if (!this.getMac(id[0])) {
          console.log(`등록되지 않은 사용자 접근`)
          res.content = {
            type: MESSAGE_CONTENT_TYPE.text,
            text: `${id[0]}@${id[1]}님은\n근태관리 명단에\n등록되지 않은 사용자 입니다`,
          }
          return res
        }
        switch (callbackEvent.content.postback) {
          // 사용자가 BOT과의 메시지방을 개설하고 '대화시작' 클릭 후 액션
          case 'start': {
            console.log(`start`)
            res.content = {
              type: MESSAGE_CONTENT_TYPE.text,
              text: '냥펀스튜디오 근태관리 봇 입니다!\n아무말이나 입력하신 후\n사용하시면 됩니다',
            }
            return res
          }

          // "출근하기" 버튼 클릭 액션
          case '출근': {
            let query = `SELECT _in FROM io_status WHERE mac = ? AND date_format(lastupdate,'%Y-%m-%d') = date_format(?,'%Y-%m-%d');`
            try {
              // 출근 처리 요청 로그
              console.log(
                `${this.getName(
                  id[0]
                )} 님 ${callbackTime}에 출근처리(UPDATE) 요청`
              )
              // DB 조회 쿼리 실행문
              const result = await pool.query(query, [
                this.getMac(id[0]),
                callbackTime,
              ])
              // 출근 정보가 있는 경우
              if (result[0][0]._in) {
                // 중복 출근 요청 로그
                console.log(
                  `${result[0][0]._in.toLocaleString()}에 출근 처리되어있음`
                )
                res.content = {
                  type: MESSAGE_CONTENT_TYPE.text,
                  text: `${this.getName(
                    id[0]
                  )}님은\n오늘 이미 출근하셨습니다\n출근시간 : ${result[0][0]._in.toLocaleString()}`,
                }

                return res
              } else {
                query = `UPDATE io_status 
                  SET now = 'IN',
                  lastupdate = '${callbackTime}',
                  _in = '${callbackTime}'
                  WHERE date_format('${callbackTime}','%y-%m-%d') 
                  = date_format(lastupdate,'%y-%m-%d') 
                  AND mac = '${this.getMac(id[0])}';`

                const updateResult = await pool.query(query)
                if (updateResult[0].affectedRows > 0) {
                  console.log('update 성공')
                  res.content = {
                    type: MESSAGE_CONTENT_TYPE.text,
                    text: `${callbackTime}에\n출근 처리 되었습니다`,
                  }
                  return res
                } else {
                  res.content = {
                    type: MESSAGE_CONTENT_TYPE.text,
                    text: '출근 처리에 실패했습니다',
                  }
                  return res
                }
              }
            } catch (err) {
              console.error(`Database connection error (출근): ${err.message}`)
            }
            break
          }

          // "퇴근하기" 버튼 클릭 액션
          case '퇴근': {
            let query = `SELECT _in FROM io_status 
            WHERE mac = '${this.getMac(id[0])}' 
            AND date_format(lastupdate,'%Y-%m-%d') = date_format('${callbackTime}','%Y-%m-%d');`

            try {
              const result = await pool.query(query)

              if (result[0][0]._in === null) {
                res.content = {
                  type: MESSAGE_CONTENT_TYPE.text,
                  text: `오늘 (${callbackDate}) 출근 기록이 없습니다`,
                }
                return res
              } else {
                query = `UPDATE io_status 
                  SET now = 'OUT',
                  lastupdate = '${callbackTime}',
                  _out = '${callbackTime}'
                  WHERE date_format('${callbackTime}','%y-%m-%d') 
                  = date_format(lastupdate,'%y-%m-%d') 
                  AND mac = '${this.getMac(id[0])}';`
                const updateResult = await pool.query(query)

                if (updateResult[0].affectedRows > 0) {
                  console.log('update 성공')
                  const workTime = await this.getTodayWorkTime(
                    callbackTime,
                    id[0]
                  )
                  const workTime2String = `${workTime[0][0].worked_hour}시간 ${workTime[0][0].worked_minute}분`
                  res.content = {
                    type: MESSAGE_CONTENT_TYPE.text,
                    text: `퇴근처리 되었습니다.\n오늘 근무시간 : ${workTime2String}`,
                  }
                  return res
                } else {
                  console.log('update 에 실패했습니다')
                  res.content = {
                    type: MESSAGE_CONTENT_TYPE.text,
                    text: '퇴근 처리에 실패했습니다',
                  }
                  return res
                }
              }
            } catch (err) {
              console.error(`Database connection error (퇴근): ${err.message}`)
            }
            break
          }
          // "근무시간 확인" 버튼 클릭 액션
          case '근무시간': {
            res.content = {
              type: MESSAGE_CONTENT_TYPE.buttonTemplate,
              contentText: '해당하는 버튼을 클릭하세요',
              actions: this._getTimeButtonActions(),
            }
            return res
          }

          // "근무시간 확인" -> "이번 주 근무시간 조회" 버튼 클릭 액션
          case 'week': {
            const thisWeekWorkTime = await this.getThisWeekWorkTime(id[0])
            let sum = this.sumWorkedTime(thisWeekWorkTime)

            console.log(
              `이번 주 총근무시간 :: ${sum} :: ${Math.floor(sum / 60)}시간 ${
                sum % 60
              }분`
            )
            res.content = {
              type: MESSAGE_CONTENT_TYPE.text,
              text: `${this.getName(id[0])}님은 이번 주\n총 [ ${Math.floor(
                sum / 60
              )}시간${sum % 60}분 ]\n근무 하셨습니다`,
            }
            return res
          }

          case 'thismonth': {
            const thisMonthWorkTime = await this.getMonthlyWorkTime(
              id[0],
              'this'
            )
            let sum = this.sumWorkedTime(thisMonthWorkTime)

            console.log(
              `이번 달 총근무시간 :: ${sum} :: ${Math.floor(sum / 60)}시간 ${
                sum % 60
              }분`
            )
            res.content = {
              type: MESSAGE_CONTENT_TYPE.text,
              text: `${this.getName(id[0])}님은 이번 달\n총 [ ${Math.floor(
                sum / 60
              )}시간${sum % 60}분 ]\n근무 하셨습니다`,
            }
            return res
          }

          case 'lastmonth': {
            const thisMonthWorkTime = await this.getMonthlyWorkTime(
              id[0],
              'last'
            )
            let sum = this.sumWorkedTime(thisMonthWorkTime)

            console.log(
              `지난 달 총근무시간 :: ${sum} :: ${Math.floor(sum / 60)}시간 ${
                sum % 60
              }분`
            )
            res.content = {
              type: MESSAGE_CONTENT_TYPE.text,
              text: `${this.getName(id[0])}님은 지난 달\n총 [ ${Math.floor(
                sum / 60
              )}시간${sum % 60}분 ]\n근무 하셨습니다`,
            }
            return res
          }

          case 'quarter': {
            const thisMonthWorkTime = await this.getQuaterWorkedTime(
              id[0],
              'last'
            )
            let sum = this.sumWorkedTime(thisMonthWorkTime)

            console.log(
              `지난 달 총근무시간 :: ${sum} :: ${Math.floor(sum / 60)}시간 ${
                sum % 60
              }분`
            )
            res.content = {
              type: MESSAGE_CONTENT_TYPE.text,
              text: `${this.getName(id[0])}님은 이번 분기 \n총 [ ${Math.floor(
                sum / 60
              )}시간${sum % 60}분 ]\n근무 하셨습니다`,
            }
            return res
          }
          // 아무말이나 입력했을 때 액션
          default: {
            res.content = {
              type: MESSAGE_CONTENT_TYPE.buttonTemplate,
              contentText: '해당하는 버튼을 클릭하세요',
              actions: this._getButtonActions(),
            }
            return res
          }
        }
      } else {
        console.log('알 수 없는 content type')
        return null
      }
    } else {
      console.log('알 수 없는 callback type')
      return null
    }
  }

  /**
   * Button 목록 반환
   * @return {Array} 버튼 배열
   */
  _getButtonActions() {
    return [
      {
        type: 'message',
        label: '출근하기',
        text: '출근 요청',
        postback: '출근',
      },
      {
        type: 'message',
        label: '퇴근하기',
        text: '퇴근 요청',
        postback: '퇴근',
      },
      {
        type: 'message',
        label: '근무시간 확인',
        text: '근무시간 확인',
        postback: '근무시간',
      },
      {
        type: 'uri',
        label: '빅브라더',
        uri: 'http://n.nfun.kr:8023/flex',
      },
    ]
  }

  _getTimeButtonActions() {
    return [
      {
        type: 'message',
        label: '이번 주 근무시간 조회',
        text: '이번 주 근무시간',
        postback: 'week',
      },
      {
        type: 'message',
        label: '이번 달 근무시간 조회',
        text: '이번 달 근무시간',
        postback: 'thismonth',
      },
      {
        type: 'message',
        label: '지난 달 근무시간 조회',
        text: '지난 달 근무시간',
        postback: 'lastmonth',
      },
      {
        type: 'message',
        label: '분기별 근무시간 조회',
        text: '분기별 근무시간',
        postback: 'quarter',
      },
    ]
  }

  getMac(id) {
    try {
      const mac = USERS[id].MAC
      return mac
    } catch (err) {
      console.error(err)
      return
    }
  }
  getName(id) {
    try {
      const mac = USERS[id].NAME
      return mac
    } catch (err) {
      console.error(err)
      return
    }
  }

  sumWorkedTime(thisWeekWorkTime) {
    let sum = 0
    for (var i in thisWeekWorkTime) {
      sum = sum + thisWeekWorkTime[i].worked_time
    }

    return sum
  }

  async getTodayWorkTime(callbackDate, id) {
    const query = `SELECT truncate(timestampdiff(minute,_in,_out) / 60,0) as worked_hour,
    timestampdiff(minute,_in,_out) % 60 as worked_minute
    ,_in,_out FROM io_status WHERE mac = '${await this.getMac(
      id
    )}' AND date_format(lastupdate,'%Y-%m-%d') = date_format('${callbackDate}','%Y-%m-%d');`
    try {
      const result = await pool.query(query)
      return result
    } catch (err) {
      console.error(`Database connection error (getWorkTime): ${err.message}`)
    }
  }

  async getThisWeekWorkTime(id) {
    const query = `SELECT date_format(lastupdate,'%a') as 'day',TIMESTAMPDIFF(minute,_in,if(now='IN',lastupdate,_out)) AS 'worked_time' FROM io_status WHERE date(lastupdate)
    BETWEEN SUBDATE(DATE(DATE_ADD(NOW(),INTERVAL 8 HOUR)),DATE_FORMAT(DATE_ADD(NOW(),INTERVAL 8 HOUR), '%w'))
    AND SUBDATE(date(DATE_ADD(NOW(),INTERVAL 8 HOUR)),DATE_FORMAT(DATE_ADD(NOW(),INTERVAL 8 HOUR),'%w')-6)
    AND mac = '${this.getMac(id)}';`

    try {
      const result = await pool.query(query)
      return result[0]
    } catch (err) {
      console.error(
        `Database connection error (getThisWeekWorkTime): ${err.message}`
      )
    }
  }

  async getQuaterWorkedTime(id) {
    const query = `SELECT date_format(lastupdate,'%d') as 'day',TIMESTAMPDIFF(minute,_in,if(now='IN',lastupdate,_out)) AS 'worked_time'
    FROM io_status where quarter(lastupdate) = 1 
    AND mac = '${this.getMac(id)}';`
    try {
      const result = await pool.query(query)
      return result[0]
    } catch (err) {
      console.error(
        `Database connection error (getQuaterWorkedTime): ${err.message}`
      )
    }
  }

  async getMonthlyWorkTime(id, when) {
    if (when === 'this') {
      const query = `SELECT date_format(lastupdate,'%d') as 'day',TIMESTAMPDIFF(minute,_in,if(now='IN',lastupdate,_out)) AS 'worked_time'
    FROM io_status where date_format(lastupdate,'%m') = DATE_FORMAT(DATE_ADD(NOW(),INTERVAL 8 HOUR), '%m')
    AND mac = '${this.getMac(id)}';`
      try {
        const result = await pool.query(query)
        return result[0]
      } catch (err) {
        console.error(
          `Database connection error (getMonthlyWorkTime | this): ${err.message}`
        )
      }
    } else if (when === 'last') {
      const query = `SELECT date_format(lastupdate,'%d') as 'day',TIMESTAMPDIFF(minute,_in,if(now='IN',lastupdate,_out)) AS 'worked_time'
      FROM io_status where date_format(lastupdate,'%m') = DATE_FORMAT(LAST_DAY(NOW() - interval 1 month), '%m') 
      AND mac = '${this.getMac(id)}';`
      try {
        const result = await pool.query(query)
        return result[0]
      } catch (err) {
        console.error(
          `Database connection error (getMonthlyWorkTime | last): ${err.message}`
        )
      }
    } else {
      console.error('parameter value is not correct (getMonthlyWorkTime)')
    }
  }

  getCallbackDate(callbackDate) {
    let year = callbackDate.getFullYear()
    let month = callbackDate.getMonth() + 1 // 월
    if (month / 10 < 1) {
      month = '0' + month
    }
    let date = callbackDate.getDate() // 날짜
    if (date / 10 < 1) {
      date = '0' + date
    }

    return `${year}-${month}-${date}`
  }

  getCallbackTime(callbackDate) {
    let year = callbackDate.getFullYear()
    let month = callbackDate.getMonth() + 1 // 월
    if (month / 10 < 1) {
      month = '0' + month
    }
    let date = callbackDate.getDate() // 날짜
    if (date / 10 < 1) {
      date = '0' + date
    }

    let hours = callbackDate.getHours() // 시
    if (hours / 10 < 1) {
      hours = '0' + hours
    }
    let minutes = callbackDate.getMinutes() // 분
    if (minutes / 10 < 1) {
      minutes = '0' + minutes
    }
    let seconds = callbackDate.getSeconds() // 초
    if (seconds / 10 < 1) {
      seconds = '0' + seconds
    }

    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`
  }
}
pool.query('SELECT 1')
setInterval(function () {
  pool.query('SELECT 1')
  console.log(`db ping | ${Date()}`)
}, 1000 * 60 * 60)
