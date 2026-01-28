-- usage_duration을 소수점 지원하도록 DECIMAL로 변경
ALTER TABLE status_board ALTER COLUMN usage_duration TYPE DECIMAL(4,1);
