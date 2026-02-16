#!/usr/bin/env python3.12
"""
chotalk 메시지 처리 플로우차트 PDF 생성
"""
from fpdf import FPDF

FONT_PATH = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
OUTPUT = '/Users/baecheol-eung/chotalk/docs/message-flow.pdf'

# Colors
C_BG      = (245, 245, 250)
C_TITLE   = (30, 30, 80)
C_START   = (76, 175, 80)    # green
C_END_BOX = (244, 67, 54)    # red
C_DECIDE  = (255, 193, 7)    # amber
C_PROCESS = (66, 133, 244)   # blue
C_SPECIAL = (156, 39, 176)   # purple
C_GRAY    = (158, 158, 158)
C_WHITE   = (255, 255, 255)
C_LIGHT   = (232, 240, 254)
C_LIGHT_G = (232, 245, 233)
C_LIGHT_R = (253, 232, 232)
C_LIGHT_P = (243, 229, 245)
C_LIGHT_Y = (255, 249, 196)


class FlowchartPDF(FPDF):
    def __init__(self):
        super().__init__(orientation='P', unit='mm', format='A4')
        self.add_font('main', '', FONT_PATH)
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        pass

    def footer(self):
        self.set_y(-12)
        self.set_font('main', '', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'chotalk message-flow  |  page {self.page_no()}/{{nb}}', align='C')

    # ── Drawing helpers ──

    def draw_box(self, x, y, w, h, text, bg=(255,255,255), border=(0,0,0), text_color=(0,0,0), radius=3, font_size=9):
        self.set_fill_color(*bg)
        self.set_draw_color(*border)
        self.set_line_width(0.4)
        self.rect(x, y, w, h, style='DF')
        self.set_font('main', '', font_size)
        self.set_text_color(*text_color)
        self.set_xy(x + 1, y + 1)
        self.multi_cell(w - 2, h / max(text.count('\n') + 1, 1) - 1, text, align='C')

    def draw_diamond(self, cx, cy, w, h, text, bg=C_DECIDE, font_size=8):
        self.set_fill_color(*bg)
        self.set_draw_color(180, 150, 0)
        self.set_line_width(0.4)
        # draw diamond as polygon
        pts = [(cx, cy - h/2), (cx + w/2, cy), (cx, cy + h/2), (cx - w/2, cy)]
        for i, (px, py) in enumerate(pts):
            nx, ny = pts[(i+1) % 4]
            self.line(px, py, nx, ny)
        # fill with lines trick - just draw text
        self.set_font('main', '', font_size)
        self.set_text_color(50, 40, 0)
        self.set_xy(cx - w/2 + 4, cy - 4)
        self.multi_cell(w - 8, 4, text, align='C')

    def arrow_down(self, x, y1, y2, label='', label_side='right'):
        self.set_draw_color(100, 100, 100)
        self.set_line_width(0.35)
        self.line(x, y1, x, y2)
        # arrowhead
        self.line(x, y2, x - 1.5, y2 - 3)
        self.line(x, y2, x + 1.5, y2 - 3)
        if label:
            self.set_font('main', '', 7)
            self.set_text_color(100, 100, 100)
            if label_side == 'right':
                self.text(x + 2, (y1 + y2) / 2 + 1, label)
            else:
                self.text(x - 12, (y1 + y2) / 2 + 1, label)

    def arrow_right(self, x1, y, x2, label=''):
        self.set_draw_color(100, 100, 100)
        self.set_line_width(0.35)
        self.line(x1, y, x2, y)
        self.line(x2, y, x2 - 3, y - 1.5)
        self.line(x2, y, x2 - 3, y + 1.5)
        if label:
            self.set_font('main', '', 7)
            self.set_text_color(100, 100, 100)
            self.text((x1 + x2) / 2 - 4, y - 2, label)

    def section_title(self, text, y=None):
        if y is not None:
            self.set_y(y)
        self.set_font('main', '', 16)
        self.set_text_color(*C_TITLE)
        self.cell(0, 10, text, ln=True)
        self.set_draw_color(*C_PROCESS)
        self.set_line_width(0.6)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def legend_item(self, x, y, color, label):
        self.set_fill_color(*color)
        self.set_draw_color(100, 100, 100)
        self.rect(x, y, 8, 5, style='DF')
        self.set_font('main', '', 8)
        self.set_text_color(60, 60, 60)
        self.text(x + 10, y + 4, label)

    # ── Row helper for trigger table ──
    def trigger_row(self, priority, signal, condition, handler, result, bg):
        self.set_fill_color(*bg)
        self.set_font('main', '', 8)
        self.set_text_color(40, 40, 40)
        h = 10
        x = 10
        self.set_xy(x, self.get_y())
        self.cell(10, h, str(priority), border=1, fill=True, align='C')
        self.cell(28, h, signal, border=1, fill=True, align='C')
        self.cell(62, h, condition, border=1, fill=True, align='C')
        self.cell(38, h, handler, border=1, fill=True, align='C')
        self.cell(52, h, result, border=1, fill=True, align='C')
        self.ln(h)


def build_pdf():
    pdf = FlowchartPDF()
    pdf.alias_nb_pages()

    # ══════════════════════════════════════════
    # PAGE 1: 전체 메시지 수신 흐름
    # ══════════════════════════════════════════
    pdf.add_page()
    pdf.set_fill_color(*C_BG)
    pdf.rect(0, 0, 210, 297, style='F')

    pdf.section_title('1. 전체 메시지 수신 흐름 (POST /api/bot/message)')

    # Start
    pdf.draw_box(70, 30, 70, 10, 'POST 메시지 수신', bg=C_LIGHT_G, border=C_START, font_size=10)
    pdf.arrow_down(105, 40, 48)

    # Validation
    pdf.draw_box(55, 48, 100, 10, 'room / sender / message 필수 필드 검증', bg=C_WHITE, border=C_GRAY)
    pdf.arrow_down(105, 58, 66)

    # Slots query
    pdf.draw_box(55, 66, 100, 10, '활성 슬롯 조회 (is_active=true)', bg=C_WHITE, border=C_GRAY)
    pdf.arrow_down(105, 76, 84)

    # ㅈ.ㅁ check
    pdf.draw_box(30, 84, 68, 12, 'message에 "ㅈ.ㅁ" 포함?\n→ processDesignatedSection()', bg=C_LIGHT_P, border=C_SPECIAL, font_size=8)
    pdf.arrow_right(98, 90, 115, 'YES')
    pdf.draw_box(115, 84, 55, 12, 'ㅈ.ㅁ 섹션 파싱\n→ designated_notices\n증분 업데이트', bg=C_LIGHT_P, border=C_SPECIAL, font_size=7)

    pdf.arrow_down(65, 96, 108)

    # Match slots
    pdf.draw_box(35, 108, 90, 10, '아가씨 이름 매칭 (slots ↔ message)', bg=C_WHITE, border=C_GRAY)
    pdf.arrow_down(80, 118, 128)

    # Multi-line parse
    pdf.draw_box(25, 128, 110, 14, '멀티라인 파싱\n줄별 방번호 상속 + 아가씨별 줄 추출', bg=C_LIGHT, border=C_PROCESS, font_size=8)
    pdf.arrow_down(80, 142, 152)

    # ㅈㅈ check
    pdf.draw_box(30, 152, 100, 10, '첫 줄이 ㅈㅈ/정정? → messageStartsWithCorrection', bg=C_LIGHT_Y, border=(200, 180, 0), font_size=8)
    pdf.arrow_down(80, 162, 172)

    # Per-line processing
    pdf.draw_box(25, 172, 110, 12, '각 줄별 parseMessage + parseGirlSignals\n→ 트리거 우선순위 체인 (Page 2)', bg=C_LIGHT, border=C_PROCESS, font_size=8)
    pdf.arrow_down(80, 184, 194)

    # Result
    pdf.draw_box(55, 194, 80, 10, 'JSON 응답 반환', bg=C_LIGHT_G, border=C_START)

    # Legend
    pdf.set_font('main', '', 10)
    pdf.set_text_color(*C_TITLE)
    pdf.text(15, 220, '범례:')
    pdf.legend_item(15, 224, C_LIGHT_G, '시작/종료')
    pdf.legend_item(15, 232, C_WHITE, '일반 처리')
    pdf.legend_item(15, 240, C_LIGHT, '핵심 로직')
    pdf.legend_item(15, 248, C_LIGHT_P, 'ㅈ.ㅁ 지명 처리')
    pdf.legend_item(15, 256, C_LIGHT_Y, '조건 분기')

    # ══════════════════════════════════════════
    # PAGE 2: 트리거 우선순위 체인
    # ══════════════════════════════════════════
    pdf.add_page()
    pdf.set_fill_color(*C_BG)
    pdf.rect(0, 0, 210, 297, style='F')

    pdf.section_title('2. 트리거 우선순위 체인 (각 아가씨 줄별)')

    # Table header
    pdf.set_fill_color(50, 50, 100)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('main', '', 8)
    x = 10
    h = 8
    pdf.set_xy(x, pdf.get_y())
    pdf.cell(10, h, '순위', border=1, fill=True, align='C')
    pdf.cell(28, h, '신호', border=1, fill=True, align='C')
    pdf.cell(62, h, '조건', border=1, fill=True, align='C')
    pdf.cell(38, h, '핸들러', border=1, fill=True, align='C')
    pdf.cell(52, h, 'DB 결과', border=1, fill=True, align='C')
    pdf.ln(h)

    rows = [
        ('1', 'ㄱㅌ (취소)', 'isCancel', 'handleCancel', 'trigger_type → canceled'),
        ('2', 'ㅎㅅㄱㅈㅈㅎ\n(현시간재진행)', 'isNewSession\n&& roomNumber', 'handleNewSession', '새 세션 INSERT\n(기존 무시)'),
        ('3', 'ㅈㅈㅎ (재진행)', 'isResume', 'handleResume', '최근 종료 레코드\n→ start로 UPDATE'),
        ('4', 'ㄲ / 끝 (종료)', 'isEnd\n&& roomNumber', 'handleSessionEnd', 'is_in_progress=false\ntrigger_type=end'),
        ('5', 'ㅈㅈ + 시간패턴\n(ㄲ 없음)', 'isCorrection\n&& roomNumber\n&& manualTime', '직접 UPDATE', 'start_time 수정\ndata_changed=true'),
        ('6', '방번호 (일반시작)', 'roomNumber\n&& !isEnd\n&& !isDesignatedFee 등', 'handleSessionStart', '새 세션 INSERT\n(중복시 무시)'),
        ('7', 'ㅈㅈ + 방번호\n(DB 세션 없음)', 'messageStartsWithCorrection\n&& roomNumber\n&& DB 진행중 세션 없음', 'handleSessionStart', '신규 세션 생성'),
        ('8', 'ㅈㅈ + 방번호\n(DB 세션 있음)', 'messageStartsWithCorrection\n&& roomNumber\n&& DB 진행중 세션 있음', '직접 UPDATE', '시간패턴 있으면\nstart_time 정정'),
        ('9', '기타', '위 조건 모두 불일치', '없음', 'type: message\n(로그만 저장)'),
    ]

    colors = [
        C_LIGHT_R, C_LIGHT_P, C_LIGHT_P, C_LIGHT_R,
        C_LIGHT_Y, C_LIGHT_G, C_LIGHT_G, C_LIGHT_Y, (240, 240, 240),
    ]

    for i, (pri, sig, cond, handler, result) in enumerate(rows):
        bg = colors[i]
        pdf.set_fill_color(*bg)
        pdf.set_font('main', '', 7)
        pdf.set_text_color(40, 40, 40)

        lines = max(sig.count('\n'), cond.count('\n'), result.count('\n')) + 1
        rh = max(10, lines * 5 + 2)

        y_start = pdf.get_y()
        x = 10

        pdf.set_xy(x, y_start)
        pdf.cell(10, rh, pri, border=1, fill=True, align='C')
        x += 10

        pdf.set_xy(x, y_start)
        pdf.multi_cell(28, rh / max(sig.count('\n') + 1, 1), sig, border=1, fill=True, align='C')
        x += 28

        pdf.set_xy(x, y_start)
        pdf.multi_cell(62, rh / max(cond.count('\n') + 1, 1), cond, border=1, fill=True, align='C')
        x += 62

        pdf.set_xy(x, y_start)
        pdf.multi_cell(38, rh / max(handler.count('\n') + 1, 1), handler, border=1, fill=True, align='C')
        x += 38

        pdf.set_xy(x, y_start)
        pdf.multi_cell(52, rh / max(result.count('\n') + 1, 1), result, border=1, fill=True, align='C')

        pdf.set_y(y_start + rh)

    # Key notes
    pdf.ln(6)
    pdf.set_font('main', '', 9)
    pdf.set_text_color(*C_TITLE)
    pdf.cell(0, 6, '핵심 포인트:', ln=True)
    pdf.set_font('main', '', 8)
    pdf.set_text_color(60, 60, 60)

    notes = [
        '- 순위 1~6: 위에서 아래로 else if 체인 (먼저 매칭되면 이후 무시)',
        '- 순위 4: ㅈㅈ 메시지에서 ㄲ 있는 줄 → isCorrection=true 자동 설정',
        '- 순위 6: ㅈㅁㅅㅅ/ㅈㅁㅂㅅㅅ/ㅇㅈ 있으면 일반 시작 차단됨',
        '- 순위 7~8: ㅈㅈ 메시지 catch-all → DB에서 진행중 세션 직접 조회',
        '  → 세션 없음: 신규 생성 / 세션 있음: 시간패턴으로 start_time 정정',
        '- handleSessionStart 내부: 이미 is_in_progress=true 세션 있으면 자동 무시',
    ]
    for note in notes:
        pdf.cell(0, 5, note, ln=True)

    # ══════════════════════════════════════════
    # PAGE 3: 각 핸들러 상세
    # ══════════════════════════════════════════
    pdf.add_page()
    pdf.set_fill_color(*C_BG)
    pdf.rect(0, 0, 210, 297, style='F')

    pdf.section_title('3. 핸들러 상세 동작')

    handlers = [
        ('handleCancel (ㄱㅌ)', C_LIGHT_R, [
            'is_in_progress=true인 레코드 검색',
            '방번호 일치 확인 (있으면)',
            'trigger_type → "canceled", is_in_progress → false',
        ]),
        ('handleNewSession (ㅎㅅㄱㅈㅈㅎ)', C_LIGHT_P, [
            '기존 레코드 무시, 무조건 새 INSERT',
            'getOrCreateRoom() → 방 조회/생성',
            'trigger_type="start", is_in_progress=true',
        ]),
        ('handleResume (ㅈㅈㅎ)', C_LIGHT_P, [
            '가장 최근 레코드 1개 조회 (created_at DESC)',
            'trigger_type="end"가 아니면 재진행 불가',
            'is_in_progress=true, end_time=null, trigger_type="start"',
            'data_changed=true, end_sent_at=null (재발송)',
        ]),
        ('handleSessionEnd (ㄲ/끝)', C_LIGHT_R, [
            '기존 start_time 조회',
            'is_in_progress=false, end_time=현재시간',
            'usage_duration 저장, trigger_type="end"',
            'checkAndCloseRoom() → 모든 아가씨 종료시 방 닫기',
        ]),
        ('handleSessionStart (방번호)', C_LIGHT_G, [
            '이미 is_in_progress=true 세션 있으면 → 무시 (중복 방지)',
            'extractManualTime() → 수동 시간 있으면 사용',
            'getOrCreateRoom() → 방 조회/생성',
            'status_board INSERT, trigger_type="start"',
            'is_designated 플래그 설정 (ㅈㅁ 포함시)',
        ]),
        ('updateStatusBoard (공통)', C_LIGHT, [
            'isCorrection=true → 같은 slot+room 최근 레코드 UPDATE',
            '일반 종료 → in-progress 레코드 UPDATE',
            'usageDuration만 있고 세션 없음 → 종료된 레코드에 duration 추가',
            '새 시작 → INSERT',
        ]),
    ]

    for title, bg, steps in handlers:
        pdf.set_fill_color(*bg)
        pdf.set_draw_color(100, 100, 100)
        pdf.set_line_width(0.3)

        y = pdf.get_y()
        pdf.rect(12, y, 186, 6 + len(steps) * 5, style='DF')

        pdf.set_font('main', '', 9)
        pdf.set_text_color(30, 30, 80)
        pdf.set_xy(14, y + 1)
        pdf.cell(0, 5, title)
        pdf.ln(6)

        pdf.set_font('main', '', 8)
        pdf.set_text_color(50, 50, 50)
        for step in steps:
            pdf.set_x(18)
            pdf.cell(0, 5, f'  {step}', ln=True)
        pdf.ln(3)

    # ══════════════════════════════════════════
    # PAGE 4: ㅈ.ㅁ 지명 처리 흐름
    # ══════════════════════════════════════════
    pdf.add_page()
    pdf.set_fill_color(*C_BG)
    pdf.rect(0, 0, 210, 297, style='F')

    pdf.section_title('4. ㅈ.ㅁ 지명(designated) 처리 흐름')

    # Flow
    pdf.draw_box(55, 32, 100, 10, 'message에 "ㅈ.ㅁ" 포함 감지', bg=C_LIGHT_P, border=C_SPECIAL, font_size=9)
    pdf.arrow_down(105, 42, 50)

    pdf.draw_box(55, 50, 100, 10, 'message_logs에 원본 저장 (무조건)', bg=C_WHITE, border=C_GRAY, font_size=8)
    pdf.arrow_down(105, 60, 68)

    pdf.draw_box(45, 68, 120, 10, 'parseDesignatedSection() → 아가씨 이름 추출', bg=C_LIGHT, border=C_PROCESS, font_size=8)
    pdf.arrow_down(105, 78, 86)

    pdf.draw_box(45, 86, 120, 10, '활성 슬롯과 매칭 → newGirlNames', bg=C_WHITE, border=C_GRAY, font_size=8)
    pdf.arrow_down(105, 96, 104)

    pdf.draw_box(35, 104, 140, 10, '기존 designated_notices 전체 조회 → currentRecords', bg=C_WHITE, border=C_GRAY, font_size=8)
    pdf.arrow_down(105, 114, 125)

    pdf.set_font('main', '', 10)
    pdf.set_text_color(*C_TITLE)
    pdf.text(15, 123, '증분 비교 (3단계):')

    # Step 1 - Remove
    y = 128
    pdf.draw_box(10, y, 90, 18, '1단계: DB에만 있는 이름 제거\nDB에 있지만 새 메시지에 없음\n→ designated_notices_history로 이동', bg=C_LIGHT_R, border=C_END_BOX, font_size=7)
    pdf.draw_box(110, y, 90, 18, '예: 유별이 메시지에서 사라짐\n→ INSERT history\n→ DELETE notices', bg=(255, 245, 245), border=C_GRAY, font_size=7)
    pdf.arrow_right(100, y + 9, 110)

    # Step 2 - Reduce
    y = 152
    pdf.draw_box(10, y, 90, 18, '2단계: 초과분 제거\nDB가 메시지보다 많으면\n→ 초과분 history로 이동', bg=C_LIGHT_Y, border=(200, 180, 0), font_size=7)
    pdf.draw_box(110, y, 90, 18, '예: DB에 다희 3건, 메시지에 2건\n→ 1건 history로 이동', bg=(255, 252, 230), border=C_GRAY, font_size=7)
    pdf.arrow_right(100, y + 9, 110)

    # Step 3 - Add
    y = 176
    pdf.draw_box(10, y, 90, 18, '3단계: 부족분 추가\n메시지가 DB보다 많으면\n→ 부족분만 INSERT', bg=C_LIGHT_G, border=C_START, font_size=7)
    pdf.draw_box(110, y, 90, 18, '예: DB에 0건, 메시지에 여린 1건\n→ INSERT 1건', bg=(235, 250, 235), border=C_GRAY, font_size=7)
    pdf.arrow_right(100, y + 9, 110)

    # DB schema
    y = 204
    pdf.set_font('main', '', 10)
    pdf.set_text_color(*C_TITLE)
    pdf.text(15, y, 'DB 테이블 구조:')

    y += 6
    pdf.draw_box(10, y, 90, 40, 'designated_notices (현재)\n\nid, slot_id, user_id\nshop_name, girl_name\nkakao_id, target_room\nsource_log_id\nsent_at, send_success', bg=C_LIGHT, border=C_PROCESS, font_size=7)

    pdf.arrow_right(100, y + 20, 110, '사라지면')

    pdf.draw_box(110, y, 90, 40, 'designated_notices_history\n\noriginal_id (원본 참조)\n+ 동일 컬럼들\ncreated_at (원본 생성시간)\nmoved_at (이동 시간)', bg=C_LIGHT_P, border=C_SPECIAL, font_size=7)

    # ══════════════════════════════════════════
    # PAGE 5: 신호 코드 참조표
    # ══════════════════════════════════════════
    pdf.add_page()
    pdf.set_fill_color(*C_BG)
    pdf.rect(0, 0, 210, 297, style='F')

    pdf.section_title('5. 신호 코드 참조표')

    # Header
    pdf.set_fill_color(50, 50, 100)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('main', '', 9)
    h = 8
    pdf.cell(30, h, '코드', border=1, fill=True, align='C')
    pdf.cell(30, h, '별칭', border=1, fill=True, align='C')
    pdf.cell(40, h, '의미', border=1, fill=True, align='C')
    pdf.cell(90, h, '동작', border=1, fill=True, align='C')
    pdf.ln(h)

    signals = [
        ('ㄲ', '끝', '세션 종료', 'is_in_progress=false, end_time 기록, usage_duration 저장'),
        ('ㅈㅈ', '정정', '수정/정정', '메시지 첫줄: 전체 정정 모드. ㄲ 있으면 정정종료, 없으면 DB 체크'),
        ('ㅈㅈㅎ', '재진행', '재진행', '최근 종료 레코드를 다시 시작(start)으로 되돌림'),
        ('ㅎㅅㄱㅈㅈㅎ', '현시간재진행', '새 세션', '기존 무시, 무조건 새 세션 INSERT'),
        ('ㄱㅌ', '-', '취소', 'trigger_type=canceled, is_in_progress=false'),
        ('ㅈㅁ', '-', '지명', 'is_designated=true 플래그 설정'),
        ('ㅈㅁㅅㅅ', '-', '지명순번삭제', '별도 요금 신호 (세션 시작 차단)'),
        ('ㅈㅁㅂㅅㅅ', '-', '지명반순번삭제', '별도 요금 신호 (세션 시작 차단)'),
        ('ㅇㅈ', '-', '연장', '별도 연장 신호 (세션 시작 차단)'),
    ]

    colors_sig = [
        C_LIGHT_R, C_LIGHT_Y, C_LIGHT_P, C_LIGHT_P,
        C_LIGHT_R, C_LIGHT_G, (240, 240, 240), (240, 240, 240), (240, 240, 240),
    ]

    for i, (code, alias, meaning, action) in enumerate(signals):
        bg = colors_sig[i]
        pdf.set_fill_color(*bg)
        pdf.set_font('main', '', 8)
        pdf.set_text_color(40, 40, 40)
        rh = 8
        pdf.cell(30, rh, code, border=1, fill=True, align='C')
        pdf.cell(30, rh, alias, border=1, fill=True, align='C')
        pdf.cell(40, rh, meaning, border=1, fill=True, align='C')
        pdf.cell(90, rh, action, border=1, fill=True, align='C')
        pdf.ln(rh)

    # Additional notes
    pdf.ln(8)
    pdf.set_font('main', '', 10)
    pdf.set_text_color(*C_TITLE)
    pdf.cell(0, 6, '방번호 규칙:', ln=True)
    pdf.set_font('main', '', 8)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 5, '- 3자리 숫자만 인식 (예: 802, 506, 707)', ln=True)
    pdf.cell(0, 5, '- 메시지 시작 또는 중간에서 추출', ln=True)
    pdf.cell(0, 5, '- 멀티라인: 이전 줄의 방번호를 상속 (가장 가까운 위쪽 줄)', ln=True)

    pdf.ln(6)
    pdf.set_font('main', '', 10)
    pdf.set_text_color(*C_TITLE)
    pdf.cell(0, 6, 'ㅈㅈ(정정) 메시지 특수 동작:', ln=True)
    pdf.set_font('main', '', 8)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 5, '- 첫 줄이 ㅈㅈ/정정으로 시작 → messageStartsWithCorrection=true', ln=True)
    pdf.cell(0, 5, '- ㄲ 있는 줄 → isCorrection 자동 설정 → handleSessionEnd에서 정정 처리', ln=True)
    pdf.cell(0, 5, '- ㄲ 없는 줄 + 시간패턴 → start_time만 수정', ln=True)
    pdf.cell(0, 5, '- 그 외 → DB에서 진행중 세션 조회 (무조건 정정):', ln=True)
    pdf.cell(0, 5, '    세션 없음 → 신규 세션 생성 (handleSessionStart)', ln=True)
    pdf.cell(0, 5, '    세션 있음 + 시간패턴 → start_time 정정 (예: 1030 → 10:30)', ln=True)
    pdf.cell(0, 5, '    세션 있음 + 시간패턴 없음 → 무시', ln=True)

    pdf.ln(6)
    pdf.set_font('main', '', 10)
    pdf.set_text_color(*C_TITLE)
    pdf.cell(0, 6, 'ㅈ.ㅁ 섹션 파싱 규칙:', ln=True)
    pdf.set_font('main', '', 8)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 5, '- 구분선: ➖➖ㅈ.ㅁ➖➖ 패턴 감지', ln=True)
    pdf.cell(0, 5, '- 구분선 아래 줄: "손님이름 ㅡ 아가씨이름" 형식', ln=True)
    pdf.cell(0, 5, '- ㅡ (U+3161) 또는 - 로 분리, 오른쪽이 아가씨 이름', ln=True)
    pdf.cell(0, 5, '- 점(.) 자동 제거: 다.희 → 다희', ln=True)
    pdf.cell(0, 5, '- 증분 동기화: 새 메시지와 DB 비교 → 추가/제거만 수행', ln=True)

    # Save
    import os
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    pdf.output(OUTPUT)
    print(f'PDF saved: {OUTPUT}')


if __name__ == '__main__':
    build_pdf()
