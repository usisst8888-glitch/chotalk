-- 만료된 슬롯 비활성화 시 status_board → status_board_history 아카이브 추가
CREATE OR REPLACE FUNCTION deactivate_expired_slots()
RETURNS void AS $$
DECLARE
    expired_slot RECORD;
BEGIN
    -- 만료된 슬롯 목록 조회
    FOR expired_slot IN
        SELECT id FROM slots
        WHERE is_active = true
          AND expires_at::date < CURRENT_DATE
    LOOP
        -- status_board 레코드를 히스토리로 복사
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
        WHERE slot_id = expired_slot.id;

        -- status_board에서 삭제
        DELETE FROM status_board WHERE slot_id = expired_slot.id;
    END LOOP;

    -- 슬롯 비활성화
    UPDATE slots
    SET is_active = false
    WHERE is_active = true
      AND expires_at::date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
