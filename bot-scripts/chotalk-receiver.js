const scriptName = "Chotalk";
const SERVER_URL = "https://chotalk.vercel.app/api/bot/message";

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    // 알림이 온 시점의 시간 캡처 (Thread 시작 전에 캡처해야 정확함)
    var receivedAt = new Date().toISOString();

    // Thread로 비동기 처리 (메인 스레드 블로킹 방지)
    new java.lang.Thread({
        run: function() {
            try {
                var data = JSON.stringify({
                    room: room,
                    sender: sender,
                    message: msg,
                    receivedAt: receivedAt  // 알림 수신 시간
                });

                var conn = org.jsoup.Jsoup.connect(SERVER_URL)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .requestBody(data)
                    .ignoreContentType(true)
                    .ignoreHttpErrors(true)
                    .timeout(5000)  // 타임아웃 5초로 단축
                    .method(org.jsoup.Connection.Method.POST);

                var res = conn.execute();
                Log.d("Chotalk 응답: " + res.statusCode() + " - " + res.body());
            } catch (e) {
                Log.e("Chotalk 에러: " + e);
            }
        }
    }).start();
}

function onCreate(savedInstanceState, activity) {}
function onStart(activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}
