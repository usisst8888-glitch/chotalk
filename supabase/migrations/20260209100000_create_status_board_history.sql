-- ========================================
-- 1. status_board_history 테이블 생성
-- ========================================
CREATE TABLE IF NOT EXISTS status_board_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id UUID,  -- 원본 status_board의 id
    slot_id UUID,
    user_id UUID,
    shop_name TEXT,
    room_number TEXT,
    girl_name TEXT,
    is_in_progress BOOLEAN,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    source_log_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    usage_duration NUMERIC,
    kakao_id TEXT,
    target_room TEXT,
    trigger_type TEXT,
    start_sent_at TIMESTAMP,
    hourly_count INTEGER DEFAULT 0,
    end_sent_at TIMESTAMP,
    is_designated BOOLEAN,
    event_count INTEGER,
    last_hourly_sent_at TIMESTAMP,
    canceled_sent_at TIMESTAMP,
    data_changed BOOLEAN DEFAULT false,
    archived_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_history_slot_id ON status_board_history(slot_id);
CREATE INDEX IF NOT EXISTS idx_history_girl_name ON status_board_history(girl_name);
CREATE INDEX IF NOT EXISTS idx_history_target_room ON status_board_history(target_room);
CREATE INDEX IF NOT EXISTS idx_history_archived_at ON status_board_history(archived_at);
CREATE INDEX IF NOT EXISTS idx_history_kakao_id ON status_board_history(kakao_id);

-- ========================================
-- 2. 아가씨 기준 아카이브 함수
-- 조건: 해당 아가씨의 마지막 세션의 end_sent_at으로부터 8시간 경과
-- ========================================
CREATE OR REPLACE FUNCTION archive_old_sessions()
RETURNS TABLE(archived_girls TEXT, archived_count BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
    girl_record RECORD;
    total_archived BIGINT := 0;
    archived_girl_list TEXT := '';
BEGIN
    -- 각 slot_id(아가씨)별로 가장 최근 end_sent_at 확인
    FOR girl_record IN
        SELECT
            slot_id,
            girl_name,
            MAX(end_sent_at) as last_end_sent_at,
            COUNT(*) as session_count
        FROM status_board
        WHERE end_sent_at IS NOT NULL
        GROUP BY slot_id, girl_name
    LOOP
        -- end_sent_at으로부터 8시간(28800초) 이상 지났는지 확인 (한국 시간 기준)
        IF EXTRACT(EPOCH FROM ((NOW() AT TIME ZONE 'Asia/Seoul') - girl_record.last_end_sent_at)) > 28800 THEN

            -- 해당 아가씨의 진행 중인 세션이 있으면 아카이브 하지 않음
            IF EXISTS (
                SELECT 1 FROM status_board
                WHERE slot_id = girl_record.slot_id
                AND is_in_progress = true
            ) THEN
                CONTINUE;
            END IF;

            -- 히스토리로 복사 (해당 아가씨의 모든 세션)
            INSERT INTO status_board_history (
                original_id, slot_id, user_id, shop_name, room_number, girl_name,
                is_in_progress, start_time, end_time, source_log_id,
                created_at, updated_at, usage_duration, kakao_id, target_room,
                trigger_type, start_sent_at, hourly_count, end_sent_at,
                is_designated, event_count, last_hourly_sent_at,
                canceled_sent_at, data_changed, archived_at
            )
            SELECT
                id, slot_id, user_id, shop_name, room_number, girl_name,
                is_in_progress, start_time, end_time, source_log_id,
                created_at, updated_at, usage_duration, kakao_id, target_room,
                trigger_type, start_sent_at, hourly_count, end_sent_at,
                is_designated, event_count, last_hourly_sent_at,
                canceled_sent_at, data_changed, NOW()
            FROM status_board
            WHERE slot_id = girl_record.slot_id;

            -- 원본 삭제
            DELETE FROM status_board WHERE slot_id = girl_record.slot_id;

            -- 통계 업데이트
            total_archived := total_archived + girl_record.session_count;
            archived_girl_list := archived_girl_list || girl_record.girl_name || ', ';

            RAISE NOTICE '아카이브 완료: % (% 세션)', girl_record.girl_name, girl_record.session_count;
        END IF;
    END LOOP;

    -- 결과 반환
    RETURN QUERY SELECT
        TRIM(TRAILING ', ' FROM archived_girl_list) as archived_girls,
        total_archived as archived_count;
END;
$$;

-- ========================================
-- 3. Cron Job 설정 (매 30분마다 실행)
-- ========================================
-- SELECT cron.schedule(
--     'archive-old-sessions',
--     '*/30 * * * *',
--     $$ SELECT archive_old_sessions(); $$
-- );

-- ========================================
-- 4. 수동 실행 테스트
-- ========================================
-- SELECT * FROM archive_old_sessions();

-- ========================================
-- 5. Cron Job 확인 및 관리
-- ========================================
-- SELECT * FROM cron.job;
-- SELECT cron.unschedule('archive-old-sessions');

-- ========================================
-- 코멘트
-- ========================================
COMMENT ON TABLE status_board_history IS '아가씨별 end_sent_at 기준 8시간 이상 경과 시 자동 아카이브';
COMMENT ON COLUMN status_board_history.original_id IS '원본 status_board의 id';
COMMENT ON COLUMN status_board_history.archived_at IS '히스토리로 이동된 시간';
COMMENT ON FUNCTION archive_old_sessions IS '아가씨별 end_sent_at 기준 8시간 경과 세션을 status_board_history로 이동';
