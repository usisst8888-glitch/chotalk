-- designated_notices_history의 source_log_id FK를 ON DELETE SET NULL로 변경
ALTER TABLE designated_notices_history
  DROP CONSTRAINT designated_notices_history_source_log_id_fkey;

ALTER TABLE designated_notices_history
  ADD CONSTRAINT designated_notices_history_source_log_id_fkey
  FOREIGN KEY (source_log_id) REFERENCES message_logs(id) ON DELETE SET NULL;
