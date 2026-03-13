-- 심부름톡에서 팀이름 컬럼 제거
drop index if exists idx_atok_services_unique;

alter table aktalk_atok_services drop column if exists team_name;

create unique index if not exists idx_atok_services_unique
  on aktalk_atok_services(user_id, shop_name);
