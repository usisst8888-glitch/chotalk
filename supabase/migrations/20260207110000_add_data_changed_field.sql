-- Add data_changed field for tracking manual corrections
-- When room_number or usage_duration is modified via ㅈㅈ (correction),
-- set data_changed = true to trigger a re-send

ALTER TABLE status_board ADD COLUMN IF NOT EXISTS data_changed BOOLEAN DEFAULT false;
