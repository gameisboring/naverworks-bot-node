const request = require('request')
const connection = require('./lib/db')
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

const USERS = {
  admin: {
    MAC: '0C:19:F8:7B:EB:A5',
    NAME: '선현규',
    ID: `admin@botest`,
  },
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
        console.log(value)
        return
      } else {
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
   * Bot실작동부
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
    switch (callbackEvent.type) {
      // 메세지를 받은 경우
      case CALL_BACK_TYPE.message:
        // 메세지 형식에 따른 스위치문
        switch (callbackEvent.content.type) {
          // 메세지가 텍스트인 케이스
          case CALL_BACK_MESSAGE_CONTENT_TYPE.text:
            if (callbackEvent.content.postback == 'start') {
              // 멤버와 Bot과의 첫 토크를 시작하는 화면에서 '이용 시작'을 누르면 자동으로 '이용 시작'이라는 메시지가 호출된다.
              console.log(`start`)
              res.content = {
                type: MESSAGE_CONTENT_TYPE.text,
                text: '아래의 텍스트를 입력하면 응답합니다\n(소문자를 구분하지 않습니다).\n・b:button template\n・l:List template\n・c:carousel\n・i:image carousel\n・q:quick reply',
              }
              return res
            } else if (callbackEvent.content.postback == '출근') {
              const id = callbackEvent.source.accountId.split('@')
              const callbackDate = new Date(callbackEvent.createdTime)
              let query = `SELECT _in FROM io_status WHERE mac = '${this.getMac(
                id[0]
              )}' AND date_format(lastupdate,'%Y-%m-%d') = '${this.getCallbackDate(
                callbackDate
              )}';`

              const result = await (await connection).execute(query)

              if (result[0].length > 0) {
                res.content = {
                  type: MESSAGE_CONTENT_TYPE.text,
                  text: '오늘은 이미 출근하셨습니다',
                }
                return res
              } else {
                query = `INSERT 
                INTO io_status(mac,name,now,lastupdate,_in,who) 
                VALUES('${this.getMac(id[0])}', 
                '${this.getName(id[0])}',
                'IN','${this.getCallbackTime(callbackDate)}',
                '${this.getCallbackTime(callbackDate)}','P');`

                const insertResult = await (await connection).execute(query)
                if (insertResult[0].affectedRows > 0) {
                  console.log('insert 성공')
                  res.content = {
                    type: MESSAGE_CONTENT_TYPE.text,
                    text: '출근처리 되었습니다',
                  }
                  return res
                }
              }
            } else if (callbackEvent.content.postback == '퇴근') {
              const id = callbackEvent.source.accountId.split('@')
              const callbackDate = this.getCallbackTime(
                new Date(callbackEvent.createdTime)
              )

              let query = `SELECT _in FROM io_status WHERE mac = '${this.getMac(
                id[0]
              )}' AND date_format(lastupdate,'%Y-%m-%d') = '${callbackDate}';`

              const result = await (await connection).execute(query)

              if (result[0].length < 0) {
                res.content = {
                  type: MESSAGE_CONTENT_TYPE.text,
                  text: `오늘 ${callbackDate} 출근 기록이 없습니다`,
                }
                return res
              } else {
                query = `UPDATE io_status 
              SET lastupdate = '${callbackDate}',
              _out = '${callbackDate}'
              WHERE date_format('${callbackDate}','%y-%m-%d') 
              = date_format(lastupdate,'%y-%m-%d') 
              AND mac = '${this.getMac(id[0])}';`
                const updateResult = await (await connection).execute(query)

                if (updateResult[0].affectedRows > 0) {
                  console.log('update 성공')
                  res.content = {
                    type: MESSAGE_CONTENT_TYPE.text,
                    text: '퇴근처리 되었습니다',
                  }
                  return res
                }
              }
            } else if (
              callbackEvent.content.text &&
              (callbackEvent.content.text == '!근태' ||
                callbackEvent.content.text == '!근태관리')
            ) {
              res.content = {
                type: MESSAGE_CONTENT_TYPE.buttonTemplate,
                contentText: '해당하는 버튼을 클릭하세요',
                actions: this._getButtonActions(),
              }
              return res
            } else {
              res.content = {
                type: MESSAGE_CONTENT_TYPE.text,
                text: `"${callbackEvent.content.text}"\n알 수 없는 명령어 입니다`,
              }
              return res
            }
            break
          default:
            console.log('알 수 없는 content type')
            return null
        }
        break

      default:
        console.log('알 수 없는 callback')
        return null
    }
  }

  /**
   * Button template 컨텐츠 반환
   * @param {Array} conditions 조건
   * @return {object} 콘텐트
   */
  _getButtonTemplateContent(...conditions) {
    //
    if (
      !conditions.some(
        (condition) =>
          condition && (condition === '!근태관리' || condition === '!근태')
      )
    ) {
      return
    }

    return
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
        text: '!출근',
        postback: '출근',
      },
      {
        type: 'message',
        label: '퇴근하기',
        text: '!퇴근',
        postback: '퇴근',
      },
      {
        type: 'uri',
        label: 'BigBrother',
        uri: 'http://n.nfun.kr:8023/flex',
      },
    ]
  }

  getMac(id) {
    return USERS[id].MAC
  }
  getName(id) {
    return USERS[id].NAME
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
