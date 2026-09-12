revoke all privileges on table public.users, public.user_sessions
  from service_role;

grant select, insert, update on table public.users
  to service_role;

grant select, insert, delete on table public.user_sessions
  to service_role;
