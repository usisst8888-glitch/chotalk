-- 서비스 신청 시 기본 상태를 비활성(입금 확인중)으로 변경
alter table aktalk_atok_services alter column is_active set default false;
alter table aktalk_chotok_services alter column is_active set default false;
