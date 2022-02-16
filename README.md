# NAVERWORKS BOT (node.js）

NAVER WORKS Bot API를 node.js를 사용하여
사용할 수 있는 코드입니다.

# Requirements

- [Node.js](https://nodejs.org/) 0.10+
- [npm](https://www.npmjs.com/)
- [VS Code](https://code.visualstudio.com/)
- [ngrok](https://ngrok.com/) (로컬 디버깅에서 사용)
- [LINE WORKS account](https://line.worksmobile.com/jp/)
- [LINE WORKS Admin](https://contact.worksmobile.com/v2/admin/member/management)
- [LINE WORKS Developer Console](https://developers.worksmobile.com/jp/console/openapi/main)
- [LINE WORKS mobile app](https://line.worksmobile.com/jp/download/)

# Installation

```
npm install
```

# Usage

1. ngrok으로 부팅하여 콜백 url을 취득해주세요

```
ngrok http 3000
```

2. NAVER WORKS Developer Console에서
   Bot서버가 NAVER WORKS와 통신하는데 필요한
   접속정보 발급 및 Bot등록을 수행한다.

※ Bot 등록시 지정하는 Callback URL은, [ngrok](https://ngrok.com/)을 이용하여 취득한 Forwarding 의 https 의 URL 입니다.

3. NAVER WORKS 관리화면에서 Developer Console에서 등록한 Bot을 구성원들이 이용할 수 있도록 설정한다.

4. 환경 변수(.env) 수정하기
   2에서 발행한 접속 정보를 설정한다
   IMAGE_FILE_HOST => 이미지를 표시할 때의 URL

```
API_ID="API ID"
CONSUMER_KEY="Consumer key"
SERVER_ID="Server ID"
PRIVATE_KEY="인증 키"
BOT_NO="Bot No"
IMAGE_FILE_HOST="호스트 이름 (ngrok으로 취득한 호스트 https://xxxxx.XXX）"
```

5. VS Code debug start
6. NAVER WORKS mobile app에서 3에서 등록한 Bot과 대화를 진행합니다.

# License

Apache 2.0
