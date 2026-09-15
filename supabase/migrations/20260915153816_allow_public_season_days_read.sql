grant select on table public.season_days
to anon, authenticated;

create policy "season days are publicly readable"
on public.season_days for select
to anon, authenticated
using (true);
