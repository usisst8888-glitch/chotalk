-- 심부름톡/초이스톡 서비스에 입금자명 추가
alter table aktalk_atok_services add column if not exists depositor_name text;
alter table aktalk_chotok_services add column if not exists depositor_name text;
