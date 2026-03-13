-- 심부름톡 서비스 신청 테이블
create table if not exists aktalk_atok_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  shop_name text not null,
  team_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 같은 유저가 같은 가게+팀으로 중복 신청 방지
create unique index if not exists idx_atok_services_unique
  on aktalk_atok_services(user_id, shop_name, team_name);
