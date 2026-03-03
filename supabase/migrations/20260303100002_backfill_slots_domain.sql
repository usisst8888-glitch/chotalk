-- 기존 slots의 domain이 null인 레코드에 기본 도메인 설정
UPDATE slots SET domain = 'https://startalkbot.com' WHERE domain IS NULL;
