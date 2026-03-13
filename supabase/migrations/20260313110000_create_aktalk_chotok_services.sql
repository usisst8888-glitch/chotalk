-- 초이스톡 서비스 테이블
create table if not exists aktalk_chotok_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  shop_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_chotok_services_unique
  on aktalk_chotok_services(user_id, shop_name);
