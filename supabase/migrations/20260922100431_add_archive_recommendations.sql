alter table public.archives
  add column recommendation_count integer not null default 0,
  add constraint archives_recommendation_count_check
    check (recommendation_count >= 0);

create table public.archive_recommendations (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null,
  user_id uuid,
  anonymous_voter_hash text,
  created_at timestamptz not null default now(),
  constraint archive_recommendations_archive_id_fkey
    foreign key (archive_id)
    references public.archives (id)
    on delete cascade,
  constraint archive_recommendations_user_id_fkey
    foreign key (user_id)
    references public.users (id)
    on delete cascade,
  constraint archive_recommendations_identity_check
    check (num_nonnulls(user_id, anonymous_voter_hash) = 1),
  constraint archive_recommendations_anonymous_hash_check
    check (
      anonymous_voter_hash is null
      or anonymous_voter_hash ~ '^[0-9a-f]{64}$'
    )
);

create unique index archive_recommendations_archive_user_key
  on public.archive_recommendations (archive_id, user_id)
  where user_id is not null;

create unique index archive_recommendations_archive_anonymous_key
  on public.archive_recommendations (archive_id, anonymous_voter_hash)
  where anonymous_voter_hash is not null;

create index archive_recommendations_archive_created_at_idx
  on public.archive_recommendations (archive_id, created_at desc);

alter table public.archive_recommendations enable row level security;

revoke all privileges on table public.archive_recommendations
  from public, anon, authenticated;

grant select, insert, update, delete on table public.archive_recommendations
  to service_role;

create function public.toggle_archive_recommendation(
  p_archive_id uuid,
  p_user_id uuid default null,
  p_anonymous_voter_hash text default null
)
returns table (
  recommended boolean,
  recommendation_count integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_anonymous_recommendation_id uuid;
  v_archive record;
  v_recommendation_count integer;
  v_user_recommendation_id uuid;
begin
  if p_user_id is null and p_anonymous_voter_hash is null then
    raise exception 'archive_recommendation_identity_required' using errcode = 'P0001';
  end if;

  if p_anonymous_voter_hash is not null
    and p_anonymous_voter_hash !~ '^[0-9a-f]{64}$'
  then
    raise exception 'archive_recommendation_identity_invalid' using errcode = 'P0001';
  end if;

  if p_user_id is not null and not exists (
    select 1
    from public.users as app_user
    where app_user.id = p_user_id
      and app_user.status = 'active'
  ) then
    raise exception 'archive_recommendation_actor_invalid' using errcode = 'P0001';
  end if;

  select
    archive.id,
    archive.owner_id,
    archive.visibility,
    archive.deleted_at
  into v_archive
  from public.archives as archive
  where archive.id = p_archive_id
  for update;

  if not found then
    raise exception 'archive_recommendation_forbidden' using errcode = 'P0001';
  end if;

  if v_archive.deleted_at is not null
    or (
      v_archive.visibility = 'private'
      and v_archive.owner_id is distinct from p_user_id
    )
  then
    raise exception 'archive_recommendation_forbidden' using errcode = 'P0001';
  end if;

  if p_user_id is not null then
    select recommendation.id
    into v_user_recommendation_id
    from public.archive_recommendations as recommendation
    where recommendation.archive_id = p_archive_id
      and recommendation.user_id = p_user_id;

    if p_anonymous_voter_hash is not null then
      select recommendation.id
      into v_anonymous_recommendation_id
      from public.archive_recommendations as recommendation
      where recommendation.archive_id = p_archive_id
        and recommendation.anonymous_voter_hash = p_anonymous_voter_hash;

      if v_anonymous_recommendation_id is not null then
        if v_user_recommendation_id is null then
          update public.archive_recommendations
          set
            anonymous_voter_hash = null,
            user_id = p_user_id
          where id = v_anonymous_recommendation_id;

          v_user_recommendation_id := v_anonymous_recommendation_id;
        else
          delete from public.archive_recommendations
          where id = v_anonymous_recommendation_id;
        end if;
      end if;
    end if;

    if v_user_recommendation_id is null then
      insert into public.archive_recommendations (archive_id, user_id)
      values (p_archive_id, p_user_id);

      recommended := true;
    else
      delete from public.archive_recommendations
      where id = v_user_recommendation_id;

      recommended := false;
    end if;
  else
    select recommendation.id
    into v_anonymous_recommendation_id
    from public.archive_recommendations as recommendation
    where recommendation.archive_id = p_archive_id
      and recommendation.anonymous_voter_hash = p_anonymous_voter_hash;

    if v_anonymous_recommendation_id is null then
      insert into public.archive_recommendations (archive_id, anonymous_voter_hash)
      values (p_archive_id, p_anonymous_voter_hash);

      recommended := true;
    else
      delete from public.archive_recommendations
      where id = v_anonymous_recommendation_id;

      recommended := false;
    end if;
  end if;

  select count(*)::integer
  into v_recommendation_count
  from public.archive_recommendations as recommendation
  where recommendation.archive_id = p_archive_id;

  update public.archives
  set recommendation_count = v_recommendation_count
  where id = p_archive_id;

  recommendation_count := v_recommendation_count;
  return next;
end;
$$;

revoke execute on function public.toggle_archive_recommendation(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.toggle_archive_recommendation(uuid, uuid, text)
  to service_role;
