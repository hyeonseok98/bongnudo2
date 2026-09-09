alter table public.streamer_affiliations
  add column parent_affiliation_id uuid null,
  add column is_filter_visible boolean not null default true,
  add column is_quick_filter boolean not null default false,
  add column quick_filter_label text null,
  add column filter_order smallint null;

alter table public.streamer_affiliations
  add constraint streamer_affiliations_parent_affiliation_id_fkey
    foreign key (parent_affiliation_id)
    references public.streamer_affiliations (id)
    on delete set null,
  add constraint streamer_affiliations_parent_not_self_check
    check (parent_affiliation_id is null or parent_affiliation_id <> id),
  add constraint streamer_affiliations_filter_order_positive_check
    check (filter_order is null or filter_order > 0);

create index streamer_affiliations_parent_affiliation_id_idx
  on public.streamer_affiliations (parent_affiliation_id);
