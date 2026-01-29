-- pg_cron 작업 복원: 만료된 슬롯 자동 비활성화
SELECT cron.schedule(
  'deactivate-expired-slots',
  '0 15 * * *',
  'SELECT deactivate_expired_slots()'
);
