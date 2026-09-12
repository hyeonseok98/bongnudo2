create table public.users (
  id uuid primary key default gen_random_uuid(),
  chzzk_channel_id text not null unique,
  chzzk_channel_name text not null,
  role text not null default 'user',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  constraint users_chzzk_channel_id_not_empty_check
    check (length(chzzk_channel_id) > 0),
  constraint users_chzzk_channel_name_not_empty_check
    check (length(chzzk_channel_name) > 0),
  constraint users_role_check
    check (role in ('user', 'admin')),
  constraint users_status_check
    check (status in ('active', 'suspended'))
);

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint user_sessions_user_id_fkey
    foreign key (user_id)
    references public.users (id)
    on delete cascade,
  constraint user_sessions_token_hash_length_check
    check (length(token_hash) = 64)
);

create index user_sessions_user_id_idx
  on public.user_sessions (user_id);

alter table public.users enable row level security;
alter table public.user_sessions enable row level security;

revoke all privileges on table public.users, public.user_sessions
  from anon, authenticated;

grant select, insert, update on table public.users
  to service_role;

grant select, insert, delete on table public.user_sessions
  to service_role;
