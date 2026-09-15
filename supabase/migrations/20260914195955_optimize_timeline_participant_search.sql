drop function public.search_report_participants(text, integer);

create function public.search_report_participants(
  p_query text,
  p_limit integer default 20
)
returns table (
  season_participant_id uuid,
  rp_name text,
  streamer_name text,
  organization_name text,
  role text,
  profile_image_key text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with search_input as (
    select replace(
      replace(
        replace(trim(p_query), '\', '\\'),
        '%', '\%'
      ),
      '_', '\_'
    ) as escaped_query
  )
  select
    participant.id,
    participant.rp_name,
    streamer.name,
    current_affiliation.organization_name,
    current_affiliation.role,
    participant.portrait_image_key
  from public.season_participants as participant
  join public.seasons as season
    on season.id = participant.season_id
    and season.is_active = true
  join public.streamers as streamer
    on streamer.id = participant.streamer_id
  left join lateral (
    select
      organization.name as organization_name,
      role_history.role
    from public.organization_memberships as membership
    join public.organizations as organization
      on organization.id = membership.organization_id
    left join lateral (
      select history.role
      from public.organization_role_histories as history
      where history.membership_id = membership.id
        and history.end_date is null
      order by history.start_date desc nulls last, history.created_at desc
      limit 1
    ) as role_history on true
    where membership.participant_id = participant.id
      and membership.left_at is null
    order by
      membership.is_primary desc,
      membership.display_order,
      organization.name
    limit 1
  ) as current_affiliation on true
  cross join search_input
  where char_length(search_input.escaped_query) between 1 and 100
    and participant.rp_name is not null
    and trim(participant.rp_name) <> ''
    and (
      participant.rp_name ilike '%' || search_input.escaped_query || '%' escape '\'
      or streamer.name ilike '%' || search_input.escaped_query || '%' escape '\'
    )
  order by
    case
      when participant.rp_name = trim(p_query) then 0
      when streamer.name = trim(p_query) then 1
      else 2
    end,
    participant.rp_name,
    streamer.name,
    participant.id
  limit least(greatest(p_limit, 1), 20);
$$;

revoke execute on function public.search_report_participants(text, integer)
  from public, anon, authenticated;

grant execute on function public.search_report_participants(text, integer)
  to service_role;
