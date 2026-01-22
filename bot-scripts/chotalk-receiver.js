/**
 * Chotalk 메시지 감지 스크립트
 * 메신저봇R용 - 초톡/도톡방에서 메시지 감지 후 서버에 저장
 *
 * 서버에서 메시지 본문에 등록된 아가씨 닉네임이 포함되어 있는지 확인하여 저장
 */

// ============== 설정 ==============
var CONFIG = {
  SERVER_URL: "https://chotalk.vercel.app/api/bot/message",
  DEBUG: true
};

// ============== 유틸 함수 ==============
function log(message) {
  if (CONFIG.DEBUG) {
    Log.d("[Chotalk] " + message);
  }
}

function sendToServer(room, sender, message) {
  try {
    var data = {
      room: room,
      sender: sender,
      message: message
    };

    var response = org.jsoup.Jsoup.connect(CONFIG.SERVER_URL)
      .header("Content-Type", "application/json")
      .requestBody(JSON.stringify(data))
      .ignoreContentType(true)
      .ignoreHttpErrors(true)
      .timeout(10000)
      .post();

    var statusCode = response.statusCode();
    log("서버 응답: " + statusCode);
    return statusCode === 200;
  } catch (e) {
    log("서버 전송 오류: " + e.message);
    return false;
  }
}

// ============== API2 리스너 ==============
var listener = {
  onMessage: function(msg) {
    var room = msg.room;
    var sender = msg.author.name;
    var message = msg.content;

    log("메시지 감지! [" + room + "] " + sender + ": " + message);
    sendToServer(room, sender, message);
  }
};

function onLoad() {
  log("Chotalk 봇 로드됨");
}

// ============== 레거시 API (API1) ==============
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
  log("메시지 감지! [" + room + "] " + sender + ": " + msg);
  sendToServer(room, sender, msg);
}

// ============== 봇 생명주기 함수 ==============
function onStartCompile() { log("컴파일 시작"); }
function onResume() { log("봇 재개"); }
function onPause() { log("봇 일시정지"); }
function onCreate(savedInstanceState, activity) { log("봇 생성"); }
function onDestroy() { log("봇 종료"); }

// API2 등록
if (typeof Bot !== "undefined") {
  Bot.setCommandPrefix("/");
  Bot.addListener(listener);
}
