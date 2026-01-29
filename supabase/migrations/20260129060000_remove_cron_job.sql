-- pg_cron 작업 삭제
SELECT cron.unschedule('deactivate-expired-slots');
