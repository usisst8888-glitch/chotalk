const scriptName = "Chotalk";
const SERVER_URL = "https://chotalk.vercel.app/api/bot/message";

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
    // 메시지에 "샛별"이 포함되어 있으면 서버로 전송
    if (msg.indexOf("샛별") != -1) {
        try {
            var data = JSON.stringify({
                room: room,
                sender: sender,
                message: msg
            });

            var conn = org.jsoup.Jsoup.connect(SERVER_URL)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .requestBody(data)
                .ignoreContentType(true)
                .ignoreHttpErrors(true)
                .timeout(10000)
                .method(org.jsoup.Connection.Method.POST);

            var res = conn.execute();

            // 성공하면 알림
            if (res.statusCode() == 200) {
                replier.reply("샛별 메시지 저장 완료!");
            }
        } catch (e) {
            replier.reply("에러: " + e);
        }
    }
}

function onCreate(savedInstanceState, activity) {}
function onStart(activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}
