-- Im Supabase-Dashboard unter SQL Editor einmalig ausführen.

create table if not exists public.studium_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.studium_data enable row level security;
create policy "eigene Daten" on public.studium_data
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
alter publication supabase_realtime add table public.studium_data;

insert into storage.buckets (id, name, public, file_size_limit)
values ('studium-files', 'studium-files', false, 20971520)
on conflict (id) do nothing;
create policy "eigene Dateien" on storage.objects
  for all to authenticated
  using (bucket_id = 'studium-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'studium-files' and (storage.foldername(name))[1] = auth.uid()::text);
