const express = require('express')
const bodyParser = require('body-parser')

const fs = require('fs')
const app = express()
require('dotenv').config()
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const request = require('request')
const BotMessageService = require('./BotMessageService')
const { ok } = require('assert')

var port = process.env.PORT || 3000
app.listen(port, function () {
  console.log(`${port}번 포트에서 서버작동중 ! `)
})

app.set('views', './views')
app.set('view engine', 'ejs')
/* app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      // 메시지 조작 방지
      const data = crypto
        .createHmac('sha256', process.env.API_ID)
        .update(buf)
        .digest('base64')
      const signature = req.headers['x-works-signature']

      if (data !== signature) {
        throw 'NOT_MATCHED signature'
      }
      console.log(data)
      console.log(signature)
    },
  })
) */
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

/*
 * 연결상태 확인 API
 */
app.get('/', function (req, res) {
  res.send('서버 작동중 !')
})

app.get('/admin', function (req, res) {
  res.render('admin')
})

app.post('/updateIO', function (req, res) {
  res.send('ok')
})

/**
 * NAVER WORKS 로부터의 메시지를 수신하는 API
 */
app.post('/callback', async function (req, res, next) {
  res.sendStatus(200)
  try {
    const serverToken = await getServerTokenFromLineWorks()
    const botMessageService = new BotMessageService(serverToken)
    await botMessageService.send(req.body)
  } catch (error) {
    return next(error)
  }
})

/**
 * JWT 작성
 * @return {string} JWT
 */
function createJWT() {
  const iss = process.env.SERVER_ID
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 60
  const cert = fs.readFileSync(process.env.PRIVATE_KEY)

  return new Promise((resolve, reject) => {
    jwt.sign(
      { iss: iss, iat: iat, exp: exp },
      cert,
      { algorithm: 'RS256' },
      (error, jwtData) => {
        if (error) {
          console.log('createJWT error')
          reject(error)
        } else {
          resolve(jwtData)
        }
      }
    )
  })
}

/**
 * NAVER WORKS 에서 Server 토큰을 가져옵니다.
 * @return {string} Server 토큰
 */
async function getServerTokenFromLineWorks() {
  const jwtData = await createJWT()
  // 주의:
  // 이 샘플에서는 유효기간 1시간 Server 토큰을 요청이 올 때마다 LINE WORKS에서 가져옵니다.
  // 본 가동 시에는 취득한 Server 토큰을 NoSQL 데이터베이스 등에 보유하고
  // 유효기간이 지난 경우에만 다시 LINE WORKS에서 취득하도록 구현해 주시기 바랍니다.
  const postdata = {
    url: `https://authapi.worksmobile.com/b/${process.env.API_ID}/server/token`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    form: {
      grant_type: encodeURIComponent(
        'urn:ietf:params:oauth:grant-type:jwt-bearer'
      ),
      assertion: jwtData,
    },
  }
  return new Promise((resolve, reject) => {
    // LINE WORKS 에서 Server 토큰 가져오기 요청
    request.post(postdata, (error, response, body) => {
      if (error) {
        console.log('getServerTokenFromLineWorks error')
        reject(error)
      } else {
        console.log('토큰 가져오기 성공')
        resolve(JSON.parse(body).access_token)
      }
    })
  })
}
