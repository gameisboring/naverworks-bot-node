const request = require('request')
const connection = require('./lib/db')

const USERS = require('./lib/user')
/* async function test() {
  let result = await (await connection).execute('SELECT * FROM io_status')

  console.log(result[0])
} */
/**
 * 콜백 타입
 */
const CALL_BACK_TYPE = {
  /**
   * 회원의 메시지
   */
  message: 'message',
  /**
   * Bot이 여러 명의 대화방에 초대되었습니다.
   * 이 이벤트가 호출되는 타이밍
   * · API를 사용하여 Bot이 토크 룸을 생성했습니다.
   * · API를 사용하여 Bot이 토크 룸을 생성했습니다.
   * · 회원이 Bot을 포함한 대화방을 만들었습니다.
   * · Bot이 여러 명의 대화방에 초대되었습니다.
   * ※멤버 1명과 Bot의 토크룸에 다른 멤버를 초대하면 join이 콜된다(첫 1회만)
   * 초대한 멤버를 탈퇴시키고 다시 다른 멤버를 초대하면 joined가 호출되는 이 사양?
   * 어쩌면 멤버 1명과 Bot의 경우, 토크룸 ID가 지불되지 않는 것이 원인일 것이다. . .
   */
  join: 'join',
  /**
   * Bot이 여러 명의 대화방에서 퇴실했습니다.
   * 이 이벤트가 호출되는 타이밍
   * · API를 사용하여 Bot을 퇴실시켰다.
   * · 멤버가 Bot을 토크 룸에서 퇴실 시켰습니다.
   * · 어떤 이유로 여러 명의 토크 룸이 해산되었습니다.
   */
  leave: 'leave',
  /**
   * 회원이 Bot이 있는 대화방에 참가했습니다.
   * 이 이벤트가 호출되는 타이밍
   * · Bot이 토크 룸을 생성했습니다.
   * · Bot이 다른 회원을 대화방에 초대했습니다.
   * · 대화방에 있는 회원이 다른 회원을 초대했습니다.
   */
  joined: 'joined',
  /**
   * 회원이 Bot이 있는 대화방에서 퇴실함
   * 이 이벤트가 호출되는 타이밍
   * · Bot이 속한 토크 룸에서 멤버가 스스로 퇴실했거나 퇴실시켰습니다.
   * · 어떤 이유로 토크 룸이 해산되었습니다.
   */
  left: 'left',
  /**
   * postback 유형의 메시지
   * 이 이벤트가 호출되는 타이밍
   * · 메시지 전송 (Carousel)
   * · 메시지 전송 (Image Carousel)
   * ・토크리치 메뉴
   */
  postback: 'postback',
}

/* const USERS =  */

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
        /* .then((value) => {
          if (value.content.type !== 'button_template') {
            value.content.type = 'button_template'
            value.content.text = '해당하는 버튼을 클릭하세요'
            value.content.actions = this._getButtonActions()

            console.log(value)
            request.post(
              this._createMessage(value),
              (error, response, body) => {
                if (error) {
                  console.log('BotService.send error')
                  console.log(error)
                }
                console.log('post2122221212')
              }
            )
          }
        }) */
      }
    })
    /* .then(async () => {
        
        callbackEvent.content.postback = 'return'

        let res = new Promise((resolve, reject) => {
          resolve(this._getResponse(callbackEvent))
        })
        res.then((value) => {
          request.post(this._createMessage(value), (error, response, body) => {
            if (error) {
              console.log('BotService.send error')
              console.log(error)
            }
          })
        })
      }) */
  }

  /**
   * NAVER WORKS 에 보낼 Bot 메시지를 작성하여 반환합니다.
   * @param {object} res 리스폰스 데이터
   */
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

    // 콜백이벤트 타입에 따른 스위치 문
    if (callbackEvent.type === CALL_BACK_TYPE.message) {
      // 메세지 형식에 따른 스위치문
      if (callbackEvent.content.type === CALL_BACK_MESSAGE_CONTENT_TYPE.text) {
        // 메세지가 텍스트인 케이스
        const id = callbackEvent.source.accountId.split('@')
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
            text: '등록되지 않은 사용자 입니다',
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
            let query = `SELECT _in FROM io_status WHERE mac = '${this.getMac(
              id[0]
            )}' AND date_format(lastupdate,'%Y-%m-%d') = date_format('${callbackTime}','%Y-%m-%d');`
            try {
              // 출근 처리 요청 로그
              console.log(
                `${this.getName(
                  id[0]
                )} 님 ${callbackTime}에 출근처리(UPDATE) 요청`
              )
              // DB 조회 쿼리 실행문
              const result = await (await connection).execute(query)
              if (result[0][0]._in !== null) {
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

                const updateResult = await (await connection).execute(query)
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
              console.error(`Database connection error: ${err.message}`)
            }
          }

          // "퇴근하기" 버튼 클릭 액션
          case '퇴근': {
            let query = `SELECT _in FROM io_status WHERE mac = '${this.getMac(
              id[0]
            )}' AND date_format(lastupdate,'%Y-%m-%d') = date_format('${callbackTime}','%Y-%m-%d');`

            try {
              const result = await (await connection).execute(query)

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
                const updateResult = await (await connection).execute(query)

                if (updateResult[0].affectedRows > 0) {
                  console.log('update 성공')
                  const workTime = await this.getWorkTime(callbackTime, id[0])
                  const workTime2String = `${workTime[0][0].worked_hour}시간 ${workTime[0][0].worked_minute}분`
                  res.content = {
                    type: MESSAGE_CONTENT_TYPE.text,
                    text: `퇴근처리 되었습니다.\n오늘 근무시간 : ${workTime2String}`,
                    //text: `퇴근처리 되었습니다`,
                  }
                  return res
                } else {
                  console.log('update 에 실패했습니다')
                }
              }
            } catch (err) {
              console.error(`Database connection error (퇴근): ${err.message}`)
            }
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

          // "근무시간 확인" -> "이번주 근무시간 조회" 버튼 클릭 액션
          case 'week': {
            const thisWeekWorkTime = await this.getThisWeekWorkTime(id[0])
            console.log(thisWeekWorkTime)
            let sum = 0
            for (var i in thisWeekWorkTime) {
              sum = sum + thisWeekWorkTime[i].worked_time
            }
            console.log(
              `이번주총근무시간 :: ${sum} :: ${Math.floor(sum / 60)}시간 ${
                sum % 60
              }분`
            )
            res.content = {
              type: MESSAGE_CONTENT_TYPE.text,
              text: `${this.getName(id[0])}님은 이번주\n총 [${Math.floor(
                sum / 60
              )}시간 ${sum % 60}분]\n근무 하셨습니다`,
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
      /* {
        type: 'message',
        label: '근무시간 확인',
        text: '근무시간 확인',
        postback: '근무시간',
      }, */
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
        label: '이번주 근무시간 조회',
        text: '이번주 근무시간',
        postback: 'week',
      },
      {
        type: 'message',
        label: '월별 근무시간 조회',
        text: '월별 근무시간',
        postback: 'month',
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
    return USERS[id].MAC
  }
  getName(id) {
    return USERS[id].NAME
  }

  async getWorkTime(callbackDate, id) {
    const query = `SELECT truncate(timestampdiff(minute,_in,_out) / 60,0) as worked_hour,
    timestampdiff(minute,_in,_out) % 60 as worked_minute
    ,_in,_out FROM \`bt-at\`.io_status WHERE mac = '${await this.getMac(
      id
    )}' AND date_format(lastupdate,'%Y-%m-%d') = date_format('${callbackDate}','%Y-%m-%d');`
    try {
      const result = await (await connection).execute(query)
      return result
    } catch (err) {
      console.error(`Database connection error (getWorkTime): ${err.message}`)
    }
  }
  async getThisWeekWorkTime(id) {
    const query = `SELECT timestampdiff(minute,_in,_out) AS 'worked_time' FROM \`bt-at\`.io_status
    WHERE date(lastupdate) BETWEEN subdate(curdate(),date_format(curdate(),'%w')-1) 
    AND subdate(curdate(),date_format(curdate(),'%w')-7)
    AND mac = '${this.getMac(id)}';`

    try {
      const result = await (await connection).execute(query)
      return result[0]
    } catch (err) {
      console.error(
        `Database connection error (getThisWeekWorkTime): ${err.message}`
      )
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
