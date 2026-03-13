-- 아톡 메시지에 사진 첨부 여부 추가
alter table aktalk_atok add column if not exists has_photo boolean default false;
