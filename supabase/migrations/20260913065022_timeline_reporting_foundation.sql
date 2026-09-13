create extension if not exists pg_trgm with schema extensions;

alter table public.season_participants
  add constraint season_participants_id_season_id_key
  unique (id, season_id);

create table public.report_categories (
  id uuid primary key default gen_random_uuid(),
  report_type text not null,
  slug text not null,
  name text not null,
  sort_order smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_categories_report_type_check
    check (report_type in ('timeline', 'bug', 'idea')),
  constraint report_categories_slug_not_empty_check
    check (length(trim(slug)) > 0),
  constraint report_categories_name_not_empty_check
    check (length(trim(name)) > 0),
  constraint report_categories_sort_order_check
    check (sort_order > 0),
  constraint report_categories_report_type_slug_key
    unique (report_type, slug),
  constraint report_categories_report_type_name_key
    unique (report_type, name),
  constraint report_categories_id_report_type_key
    unique (id, report_type)
);

create table public.timeline_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timeline_tags_slug_not_empty_check
    check (length(trim(slug)) > 0),
  constraint timeline_tags_name_not_empty_check
    check (length(trim(name)) > 0)
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  season_id smallint not null,
  category_id uuid not null,
  title text not null,
  content text not null,
  occurred_at timestamptz not null,
  publication_status text not null default 'published',
  merged_into_event_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint timeline_events_season_id_fkey
    foreign key (season_id)
    references public.seasons (id)
    on delete restrict,
  constraint timeline_events_category_id_fkey
    foreign key (category_id)
    references public.report_categories (id)
    on delete restrict,
  constraint timeline_events_id_season_id_key
    unique (id, season_id),
  constraint timeline_events_merged_into_same_season_fkey
    foreign key (merged_into_event_id, season_id)
    references public.timeline_events (id, season_id)
    on delete restrict,
  constraint timeline_events_title_length_check
    check (char_length(title) between 1 and 100),
  constraint timeline_events_content_length_check
    check (char_length(content) between 1 and 200),
  constraint timeline_events_publication_status_check
    check (publication_status in ('draft', 'published', 'hidden', 'merged')),
  constraint timeline_events_merge_state_check
    check (
      (publication_status = 'merged' and merged_into_event_id is not null)
      or (publication_status <> 'merged' and merged_into_event_id is null)
    ),
  constraint timeline_events_not_merged_into_self_check
    check (merged_into_event_id is null or merged_into_event_id <> id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null,
  season_id smallint,
  report_type text not null,
  category_id uuid,
  timeline_event_id uuid,
  title text not null,
  content text not null,
  occurred_at timestamptz,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_reporter_user_id_fkey
    foreign key (reporter_user_id)
    references public.users (id)
    on delete restrict,
  constraint reports_season_id_fkey
    foreign key (season_id)
    references public.seasons (id)
    on delete restrict,
  constraint reports_category_scope_fkey
    foreign key (category_id, report_type)
    references public.report_categories (id, report_type)
    on delete restrict,
  constraint reports_timeline_event_same_season_fkey
    foreign key (timeline_event_id, season_id)
    references public.timeline_events (id, season_id)
    on delete restrict,
  constraint reports_id_season_id_key
    unique (id, season_id),
  constraint reports_report_type_check
    check (report_type in ('timeline', 'bug', 'idea', 'correction')),
  constraint reports_category_requirement_check
    check (
      (report_type = 'correction' and category_id is null)
      or (report_type in ('timeline', 'bug', 'idea') and category_id is not null)
    ),
  constraint reports_timeline_event_requirement_check
    check (
      (
        report_type in ('timeline', 'correction')
        and timeline_event_id is not null
        and season_id is not null
      )
      or (
        report_type in ('bug', 'idea')
        and timeline_event_id is null
      )
    ),
  constraint reports_occurred_at_requirement_check
    check (
      (report_type = 'timeline' and occurred_at is not null)
      or (report_type <> 'timeline' and occurred_at is null)
    ),
  constraint reports_title_length_check
    check (char_length(title) between 1 and 100),
  constraint reports_content_length_check
    check (char_length(content) between 1 and 200),
  constraint reports_status_check
    check (status in ('submitted', 'reviewing', 'resolved', 'rejected'))
);

create table public.timeline_event_participants (
  timeline_event_id uuid not null,
  season_id smallint not null,
  season_participant_id uuid not null,
  sort_order smallint not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint timeline_event_participants_pkey
    primary key (timeline_event_id, season_participant_id),
  constraint timeline_event_participants_event_same_season_fkey
    foreign key (timeline_event_id, season_id)
    references public.timeline_events (id, season_id)
    on delete cascade,
  constraint timeline_event_participants_participant_same_season_fkey
    foreign key (season_participant_id, season_id)
    references public.season_participants (id, season_id)
    on delete restrict,
  constraint timeline_event_participants_event_sort_order_key
    unique (timeline_event_id, sort_order),
  constraint timeline_event_participants_sort_order_check
    check (sort_order > 0),
  constraint timeline_event_participants_primary_order_check
    check (not is_primary or sort_order = 1)
);

create table public.report_participants (
  report_id uuid not null,
  season_id smallint not null,
  season_participant_id uuid not null,
  sort_order smallint not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint report_participants_pkey
    primary key (report_id, season_participant_id),
  constraint report_participants_report_same_season_fkey
    foreign key (report_id, season_id)
    references public.reports (id, season_id)
    on delete cascade,
  constraint report_participants_participant_same_season_fkey
    foreign key (season_participant_id, season_id)
    references public.season_participants (id, season_id)
    on delete restrict,
  constraint report_participants_report_sort_order_key
    unique (report_id, sort_order),
  constraint report_participants_sort_order_check
    check (sort_order > 0),
  constraint report_participants_primary_order_check
    check (not is_primary or sort_order = 1)
);

create table public.timeline_event_tags (
  timeline_event_id uuid not null,
  tag_id uuid not null,
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  constraint timeline_event_tags_pkey
    primary key (timeline_event_id, tag_id),
  constraint timeline_event_tags_timeline_event_id_fkey
    foreign key (timeline_event_id)
    references public.timeline_events (id)
    on delete cascade,
  constraint timeline_event_tags_tag_id_fkey
    foreign key (tag_id)
    references public.timeline_tags (id)
    on delete restrict,
  constraint timeline_event_tags_event_sort_order_key
    unique (timeline_event_id, sort_order),
  constraint timeline_event_tags_sort_order_check
    check (sort_order > 0)
);

create table public.report_tags (
  report_id uuid not null,
  tag_id uuid not null,
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  constraint report_tags_pkey
    primary key (report_id, tag_id),
  constraint report_tags_report_id_fkey
    foreign key (report_id)
    references public.reports (id)
    on delete cascade,
  constraint report_tags_tag_id_fkey
    foreign key (tag_id)
    references public.timeline_tags (id)
    on delete restrict,
  constraint report_tags_report_sort_order_key
    unique (report_id, sort_order),
  constraint report_tags_sort_order_check
    check (sort_order > 0)
);

create table public.report_media (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  media_type text not null,
  object_key text,
  clip_url text,
  mime_type text,
  byte_size bigint,
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  constraint report_media_report_id_fkey
    foreign key (report_id)
    references public.reports (id)
    on delete cascade,
  constraint report_media_report_sort_order_key
    unique (report_id, sort_order),
  constraint report_media_media_type_check
    check (media_type in ('image', 'chzzk_clip')),
  constraint report_media_sort_order_check
    check (sort_order > 0),
  constraint report_media_payload_check
    check (
      (
        media_type = 'image'
        and object_key is not null
        and length(trim(object_key)) > 0
        and object_key !~* '^https?://'
        and clip_url is null
        and mime_type in ('image/jpeg', 'image/png', 'image/webp')
        and byte_size between 1 and 10485760
      )
      or (
        media_type = 'chzzk_clip'
        and object_key is null
        and clip_url is not null
        and clip_url ~ '^https://'
        and mime_type is null
        and byte_size is null
      )
    )
);

create table public.timeline_event_media (
  id uuid primary key default gen_random_uuid(),
  timeline_event_id uuid not null,
  media_type text not null,
  object_key text,
  clip_url text,
  mime_type text,
  byte_size bigint,
  sort_order smallint not null,
  created_at timestamptz not null default now(),
  constraint timeline_event_media_timeline_event_id_fkey
    foreign key (timeline_event_id)
    references public.timeline_events (id)
    on delete cascade,
  constraint timeline_event_media_event_sort_order_key
    unique (timeline_event_id, sort_order),
  constraint timeline_event_media_media_type_check
    check (media_type in ('image', 'chzzk_clip')),
  constraint timeline_event_media_sort_order_check
    check (sort_order > 0),
  constraint timeline_event_media_payload_check
    check (
      (
        media_type = 'image'
        and object_key is not null
        and length(trim(object_key)) > 0
        and object_key !~* '^https?://'
        and clip_url is null
        and mime_type in ('image/jpeg', 'image/png', 'image/webp')
        and byte_size is not null
        and byte_size > 0
      )
      or (
        media_type = 'chzzk_clip'
        and object_key is null
        and clip_url is not null
        and clip_url ~ '^https://'
        and mime_type is null
        and byte_size is null
      )
    )
);

create table public.timeline_event_revisions (
  id uuid primary key default gen_random_uuid(),
  timeline_event_id uuid not null,
  editor_user_id uuid not null,
  reason text,
  before_data jsonb not null,
  after_data jsonb not null,
  created_at timestamptz not null default now(),
  constraint timeline_event_revisions_timeline_event_id_fkey
    foreign key (timeline_event_id)
    references public.timeline_events (id)
    on delete restrict,
  constraint timeline_event_revisions_editor_user_id_fkey
    foreign key (editor_user_id)
    references public.users (id)
    on delete restrict,
  constraint timeline_event_revisions_before_data_check
    check (jsonb_typeof(before_data) = 'object'),
  constraint timeline_event_revisions_after_data_check
    check (jsonb_typeof(after_data) = 'object')
);

create table public.report_user_restrictions (
  user_id uuid primary key,
  can_submit boolean not null default false,
  reason text not null,
  suspended_until timestamptz,
  created_by_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_user_restrictions_user_id_fkey
    foreign key (user_id)
    references public.users (id)
    on delete cascade,
  constraint report_user_restrictions_created_by_user_id_fkey
    foreign key (created_by_user_id)
    references public.users (id)
    on delete restrict,
  constraint report_user_restrictions_reason_not_empty_check
    check (length(trim(reason)) > 0)
);

create unique index timeline_event_participants_primary_unique_idx
  on public.timeline_event_participants (timeline_event_id)
  where is_primary = true;

create index timeline_event_participants_participant_id_idx
  on public.timeline_event_participants (season_participant_id, timeline_event_id);

create unique index report_participants_primary_unique_idx
  on public.report_participants (report_id)
  where is_primary = true;

create index report_participants_participant_id_idx
  on public.report_participants (season_participant_id, report_id);

create index timeline_event_tags_tag_id_idx
  on public.timeline_event_tags (tag_id, timeline_event_id);

create index report_tags_tag_id_idx
  on public.report_tags (tag_id, report_id);

create index timeline_events_season_id_idx
  on public.timeline_events (season_id);

create index timeline_events_category_id_idx
  on public.timeline_events (category_id);

create index timeline_events_merged_into_event_id_idx
  on public.timeline_events (merged_into_event_id)
  where merged_into_event_id is not null;

create index timeline_events_published_season_occurred_at_idx
  on public.timeline_events (season_id, occurred_at desc, id desc)
  where publication_status = 'published';

create index timeline_events_published_category_occurred_at_idx
  on public.timeline_events (season_id, category_id, occurred_at desc, id desc)
  where publication_status = 'published';

create index timeline_events_published_search_idx
  on public.timeline_events
  using gin ((title || ' ' || content) extensions.gin_trgm_ops)
  where publication_status = 'published';

create index reports_reporter_created_at_idx
  on public.reports (reporter_user_id, created_at desc);

create index reports_season_id_idx
  on public.reports (season_id)
  where season_id is not null;

create index reports_category_id_idx
  on public.reports (category_id)
  where category_id is not null;

create index reports_timeline_event_id_idx
  on public.reports (timeline_event_id)
  where timeline_event_id is not null;

create index reports_admin_inbox_idx
  on public.reports (status, report_type, created_at desc);

create index timeline_event_revisions_event_created_at_idx
  on public.timeline_event_revisions (timeline_event_id, created_at desc);

create index timeline_event_revisions_editor_user_id_idx
  on public.timeline_event_revisions (editor_user_id);

create index report_user_restrictions_created_by_user_id_idx
  on public.report_user_restrictions (created_by_user_id);

create function private.validate_timeline_event_category()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1
    from public.report_categories
    where id = new.category_id
      and report_type = 'timeline'
  ) then
    raise exception 'timeline event category must use the timeline report type'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.validate_timeline_event_category()
  from public, anon, authenticated;

create trigger timeline_events_category_scope_trigger
before insert or update of category_id
on public.timeline_events
for each row
execute function private.validate_timeline_event_category();

alter table public.report_categories enable row level security;
alter table public.timeline_tags enable row level security;
alter table public.timeline_events enable row level security;
alter table public.reports enable row level security;
alter table public.timeline_event_participants enable row level security;
alter table public.report_participants enable row level security;
alter table public.timeline_event_tags enable row level security;
alter table public.report_tags enable row level security;
alter table public.report_media enable row level security;
alter table public.timeline_event_media enable row level security;
alter table public.timeline_event_revisions enable row level security;
alter table public.report_user_restrictions enable row level security;

revoke all privileges on table
  public.report_categories,
  public.timeline_tags,
  public.timeline_events,
  public.reports,
  public.timeline_event_participants,
  public.report_participants,
  public.timeline_event_tags,
  public.report_tags,
  public.report_media,
  public.timeline_event_media,
  public.timeline_event_revisions,
  public.report_user_restrictions
from anon, authenticated;

grant select on table
  public.report_categories,
  public.timeline_tags,
  public.timeline_events,
  public.timeline_event_participants,
  public.timeline_event_tags,
  public.timeline_event_media
to anon, authenticated;

grant select, insert, update on table
  public.report_categories,
  public.timeline_tags,
  public.timeline_events,
  public.reports
to service_role;

grant select, insert on table
  public.report_participants,
  public.report_tags,
  public.report_media,
  public.timeline_event_revisions
to service_role;

grant select, insert, update, delete on table
  public.timeline_event_participants,
  public.timeline_event_tags,
  public.timeline_event_media,
  public.report_user_restrictions
to service_role;

create policy "report categories are publicly readable"
on public.report_categories for select
to anon, authenticated
using (true);

create policy "timeline tags are publicly readable"
on public.timeline_tags for select
to anon, authenticated
using (true);

create policy "published timeline events are publicly readable"
on public.timeline_events for select
to anon, authenticated
using (publication_status = 'published');

create policy "published timeline event participants are publicly readable"
on public.timeline_event_participants for select
to anon, authenticated
using (
  exists (
    select 1
    from public.timeline_events as event
    where event.id = timeline_event_participants.timeline_event_id
      and event.publication_status = 'published'
  )
);

create policy "published timeline event tags are publicly readable"
on public.timeline_event_tags for select
to anon, authenticated
using (
  exists (
    select 1
    from public.timeline_events as event
    where event.id = timeline_event_tags.timeline_event_id
      and event.publication_status = 'published'
  )
);

create policy "published timeline event media are publicly readable"
on public.timeline_event_media for select
to anon, authenticated
using (
  exists (
    select 1
    from public.timeline_events as event
    where event.id = timeline_event_media.timeline_event_id
      and event.publication_status = 'published'
  )
);

insert into public.report_categories (
  report_type,
  slug,
  name,
  sort_order
)
values
  ('timeline', 'incident-accident', '사건/사고', 1),
  ('timeline', 'daily', '일상', 2),
  ('timeline', 'humor', '유머', 3),
  ('timeline', 'romance-relationship', '연애/관계', 4),
  ('timeline', 'job-economy', '직업/경제', 5),
  ('timeline', 'promotion', '승진', 6),
  ('timeline', 'organization-news', '조직 소식', 7),
  ('timeline', 'notice-guide', '공지/안내', 8),
  ('timeline', 'other', '기타', 9),
  ('bug', 'functional-error', '기능 오류', 1),
  ('bug', 'ui-ux', 'UI/UX', 2),
  ('bug', 'login-account', '로그인/계정', 3),
  ('bug', 'data-error', '데이터 오류', 4),
  ('bug', 'mobile-responsive', '모바일/반응형', 5),
  ('bug', 'performance-loading', '성능/로딩', 6),
  ('bug', 'other', '기타', 7),
  ('idea', 'new-feature', '새 기능', 1),
  ('idea', 'existing-feature-improvement', '기존 기능 개선', 2),
  ('idea', 'ui-ux-improvement', 'UI/UX 개선', 3),
  ('idea', 'content-page', '콘텐츠/페이지', 4),
  ('idea', 'data-search', '데이터/검색', 5),
  ('idea', 'other', '기타', 6);
