-- Studium-App: einmal im Supabase SQL Editor ausführen.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  study text not null default '',
  accent text not null default '#ff6b2c',
  updated_at timestamptz not null default now()
);

create table if not exists public.app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.app_state enable row level security;

drop policy if exists "profil lesen" on public.profiles;
drop policy if exists "profil anlegen" on public.profiles;
drop policy if exists "profil ändern" on public.profiles;
create policy "profil lesen" on public.profiles for select using (auth.uid() = id);
create policy "profil anlegen" on public.profiles for insert with check (auth.uid() = id);
create policy "profil ändern" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "daten lesen" on public.app_state;
drop policy if exists "daten anlegen" on public.app_state;
drop policy if exists "daten ändern" on public.app_state;
drop policy if exists "daten löschen" on public.app_state;
create policy "daten lesen" on public.app_state for select using (auth.uid() = user_id);
create policy "daten anlegen" on public.app_state for insert with check (auth.uid() = user_id);
create policy "daten ändern" on public.app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daten löschen" on public.app_state for delete using (auth.uid() = user_id);

-- Profil automatisch bei der Registrierung anlegen
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Privater Datei-Speicher, jeder Nutzer nur in seinem Ordner
insert into storage.buckets (id, name, public) values ('dateien', 'dateien', false)
on conflict (id) do nothing;

drop policy if exists "dateien lesen" on storage.objects;
drop policy if exists "dateien hochladen" on storage.objects;
drop policy if exists "dateien ändern" on storage.objects;
drop policy if exists "dateien löschen" on storage.objects;
create policy "dateien lesen" on storage.objects for select to authenticated
  using (bucket_id = 'dateien' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "dateien hochladen" on storage.objects for insert to authenticated
  with check (bucket_id = 'dateien' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "dateien ändern" on storage.objects for update to authenticated
  using (bucket_id = 'dateien' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "dateien löschen" on storage.objects for delete to authenticated
  using (bucket_id = 'dateien' and (storage.foldername(name))[1] = auth.uid()::text);

-- Live-Sync zwischen Geräten
do $$ begin
  alter publication supabase_realtime add table public.app_state;
exception when duplicate_object then null; end $$;
