-- End-to-end encryption public keys + screen-capture privacy flag.
-- Private keys never leave the device (expo-secure-store / Keychain / Keystore).

create table if not exists public.user_keys (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  public_key text not null,
  algorithm text not null default 'x25519-xsalsa20-poly1305',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_keys enable row level security;

grant select, insert, update on table public.user_keys to authenticated;

drop policy if exists "user_keys_select_authenticated" on public.user_keys;
create policy "user_keys_select_authenticated"
  on public.user_keys for select
  to authenticated
  using (true);

drop policy if exists "user_keys_insert_own" on public.user_keys;
create policy "user_keys_insert_own"
  on public.user_keys for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "user_keys_update_own" on public.user_keys;
create policy "user_keys_update_own"
  on public.user_keys for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.touch_user_keys_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_keys_touch on public.user_keys;
create trigger user_keys_touch
  before update on public.user_keys
  for each row execute function public.touch_user_keys_updated_at();

-- Privacy: block screenshots / screen recording in chats and calls (default on).
alter table public.profiles
  add column if not exists block_screen_capture boolean not null default true;
