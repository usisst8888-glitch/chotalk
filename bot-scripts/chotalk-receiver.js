/**
 * Chotalk 메시지 감지 스크립트
 * 메신저봇R용 - 초톡/도톡방에서 메시지 감지 후 서버에 저장
 *
 * 서버에서 메시지 본문에 등록된 아가씨 닉네임이 포함되어 있는지 확인하여 저장
 *
 * 사용법:
 * 1. 메신저봇R 앱에서 새 봇 생성
 * 2. 이 스크립트 복사하여 붙여넣기
 * 3. SERVER_URL을 실제 배포 URL로 변경
 * 4. 봇 활성화
 */

// ============== 설정 ==============
var CONFIG = {
  // 서버 URL
  SERVER_URL: "https://chotalk.vercel.app/api/bot/message",

  // 디버그 모드
  DEBUG: false
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
    var responseText = response.text();

    log("서버 응답 [" + statusCode + "]: " + responseText);

    return statusCode === 200;
  } catch (e) {
    log("서버 전송 오류: " + e.message);
    return false;
  }
}

// ============== 메인 응답 함수 ==============
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
  log("메시지 감지! [" + room + "] " + sender + ": " + msg);

  // 서버로 전송 (서버에서 메시지 본문에 아가씨 닉네임 포함 여부 확인)
  sendToServer(room, sender, msg);
}
