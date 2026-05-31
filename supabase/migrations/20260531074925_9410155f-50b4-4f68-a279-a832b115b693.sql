create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;

alter table public.notifications enable row level security;

create policy "Users see own notifications" on public.notifications
  for select to authenticated using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index notifications_user_id_read_idx
  on public.notifications(user_id, read, created_at desc);

alter table public.notifications replica identity full;
alter publication supabase_realtime add table public.notifications;