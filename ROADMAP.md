# Chotalk 로드맵

## 프로젝트 개요
초톡/도톡 오픈채팅방의 메시지를 파싱하여 등록된 슬롯(아가씨)의 개인 단톡방에 자동으로 발송하는 카카오톡 자동 발송 시스템

## 시스템 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                        안드로이드 기기                                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   카카오톡       │ -> │   메신저봇R      │ -> │   API 호출       │  │
│  │  (초톡/도톡방)   │    │  (메시지 파싱)   │    │  (웹서버 전송)   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Chotalk 웹서버                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   API 수신       │ -> │   슬롯 매칭      │ -> │   발송 큐 저장   │  │
│  │  (메시지 수신)   │    │  (아가씨 이름)   │    │  (Supabase)     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        안드로이드 기기                                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   발송 큐 조회   │ <- │   메신저봇R      │ -> │   카카오톡       │  │
│  │  (API 폴링)     │    │  (발송 처리)     │    │  (단톡방 발송)   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: 웹 대시보드 (완료)

### 1.1 인증 시스템 ✅
- [x] 회원가입 (전화번호 + 비밀번호 + 사용자명)
- [x] 로그인/로그아웃
- [x] JWT 토큰 인증

### 1.2 슬롯 관리 ✅
- [x] 슬롯 목록 조회
- [x] 슬롯 추가 (아가씨 닉네임, 채팅방 이름, 채팅방 타입)
- [x] 슬롯 수정/삭제
- [x] 슬롯 활성화/비활성화 토글
- [x] 슬롯 만료일 관리
- [x] 채팅방 타입 선택 (그룹채팅/오픈채팅)

### 1.3 슬롯 구매 ✅
- [x] 슬롯 추가 구매 요청
- [x] 입금 정보 안내
- [x] 구매 요청 저장

### 1.4 발송 템플릿 ✅
- [x] 단일 발송 템플릿 저장
- [x] 변수 삽입 기능 ({아가씨이름}, {날짜}, {시간})
- [x] 줄바꿈 지원

### 1.5 가이드 페이지 ✅
- [x] 사용방법 안내

---

## Phase 2: 메시지 수신 API (예정)

### 2.1 메신저봇R → 웹서버 API
- [ ] `POST /api/bot/message` - 초톡/도톡 메시지 수신
  ```typescript
  // Request Body
  {
    kakaoId: string,        // 봇의 카카오 ID (슬롯 매칭용)
    room: string,           // 채팅방 이름 (초톡방/도톡방)
    sender: string,         // 발신자 이름 (아가씨 이름)
    message: string,        // 원본 메시지
    isGroupChat: boolean,   // 그룹채팅 여부
    packageName: string     // 패키지명
  }
  ```

### 2.2 메시지 파싱 로직
- [ ] 초톡 메시지 파싱 (손님 정보 추출)
- [ ] 도톡 메시지 파싱 (도착 알림 추출)
- [ ] 아가씨 이름으로 슬롯 매칭

### 2.3 발송 큐 시스템
- [ ] `message_queue` 테이블 생성
  ```sql
  CREATE TABLE message_queue (
    id UUID PRIMARY KEY,
    slot_id UUID REFERENCES slots(id),
    user_id UUID REFERENCES users(id),
    message_type VARCHAR(20),  -- 'chotalk' | 'dotalk'
    original_message TEXT,
    formatted_message TEXT,
    target_room VARCHAR(255),
    status VARCHAR(20),        -- 'pending' | 'sent' | 'failed'
    created_at TIMESTAMP,
    sent_at TIMESTAMP
  );
  ```

---

## Phase 3: 메시지 발송 API (예정)

### 3.1 발송 큐 조회 API
- [ ] `GET /api/bot/queue` - 대기중인 발송 메시지 조회
  ```typescript
  // Response
  {
    messages: [
      {
        id: string,
        targetRoom: string,
        message: string,
        slotId: string
      }
    ]
  }
  ```

### 3.2 발송 완료 API
- [ ] `POST /api/bot/queue/:id/complete` - 발송 완료 처리
- [ ] `POST /api/bot/queue/:id/fail` - 발송 실패 처리

### 3.3 메신저봇R 발송 스크립트
- [ ] 발송 큐 폴링 (주기적 API 호출)
- [ ] 단톡방에 메시지 발송
- [ ] 발송 결과 보고

---

## Phase 4: 메신저봇R 스크립트 (예정)

### 4.1 메시지 수신 스크립트
```javascript
// 초톡/도톡방 메시지 감지 및 서버 전송
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
  // 초톡방 또는 도톡방인 경우만 처리
  if (room.includes("초톡") || room.includes("도톡")) {
    // 서버로 메시지 전송
    var data = {
      kakaoId: "봇카카오ID",
      room: room,
      sender: sender,
      message: msg,
      isGroupChat: isGroupChat,
      packageName: packageName
    };

    var res = org.jsoup.Jsoup.connect("https://chotalk.com/api/bot/message")
      .header("Content-Type", "application/json")
      .header("Authorization", "Bearer API_KEY")
      .requestBody(JSON.stringify(data))
      .ignoreContentType(true)
      .post();
  }
}
```

### 4.2 메시지 발송 스크립트
```javascript
// 발송 큐 확인 및 메시지 발송
function checkAndSendMessages() {
  var res = org.jsoup.Jsoup.connect("https://chotalk.com/api/bot/queue")
    .header("Authorization", "Bearer API_KEY")
    .ignoreContentType(true)
    .get();

  var data = JSON.parse(res.text());

  data.messages.forEach(function(item) {
    // 단톡방에 메시지 발송
    Api.replyRoom(item.targetRoom, item.message);

    // 발송 완료 보고
    org.jsoup.Jsoup.connect("https://chotalk.com/api/bot/queue/" + item.id + "/complete")
      .header("Authorization", "Bearer API_KEY")
      .post();
  });
}

// 5초마다 발송 큐 확인
setInterval(checkAndSendMessages, 5000);
```

---

## Phase 5: 관리자 기능 (예정)

### 5.1 관리자 대시보드
- [ ] 전체 사용자 관리
- [ ] 슬롯 구매 요청 승인/거절
- [ ] 슬롯 수동 추가/연장
- [ ] 발송 통계 조회

### 5.2 발송 로그
- [ ] 발송 내역 조회
- [ ] 실패 메시지 재발송
- [ ] 일별/월별 통계

---

## Phase 6: 고도화 (예정)

### 6.1 알림 기능
- [ ] 슬롯 만료 알림
- [ ] 발송 실패 알림
- [ ] 텔레그램/디스코드 웹훅

### 6.2 성능 최적화
- [ ] Redis 캐싱
- [ ] 발송 큐 최적화
- [ ] Rate limiting

### 6.3 보안 강화
- [ ] API 키 인증
- [ ] IP 화이트리스트
- [ ] 요청 로깅

---

## 기술 스택

### Frontend
- Next.js 16
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Routes
- Supabase (PostgreSQL)
- JWT 인증

### 봇 연동
- 메신저봇R (Android)
- JavaScript 스크립트
- REST API

---

## 우선순위

1. **Phase 2** - 메시지 수신 API (핵심 기능)
2. **Phase 3** - 메시지 발송 API (핵심 기능)
3. **Phase 4** - 메신저봇R 스크립트 (연동)
4. **Phase 5** - 관리자 기능
5. **Phase 6** - 고도화
