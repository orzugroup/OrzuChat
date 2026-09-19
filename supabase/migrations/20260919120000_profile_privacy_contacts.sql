-- Profile banner, privacy, device contacts. Run in OrzuChat SQL Editor (rmvlpxryyxxdjmclqhaa).

alter table public.profiles
  add column if not exists banner_url text,
  add column if not exists show_username boolean not null default true,
  add column if not exists show_avatar boolean not null default true,
  add column if not exists show_banner boolean not null default true,
  add column if not exists show_phone boolean not null default false,
  add column if not exists show_last_seen boolean not null default true,
  add column if not exists show_read_receipts boolean not null default true;

create table if not exists public.user_contacts (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  contact_id uuid not null references public.profiles (id) on delete cascade,
  device_name text,
  created_at timestamptz not null default now(),
  primary key (owner_id, contact_id),
  constraint user_contacts_not_self check (owner_id <> contact_id)
);

create index if not exists user_contacts_owner_idx on public.user_contacts (owner_id);
create index if not exists user_contacts_contact_idx on public.user_contacts (contact_id);
create index if not exists profiles_phone_digits_idx
  on public.profiles ((regexp_replace(coalesce(phone, ''), '\D', '', 'g')));

alter table public.user_contacts enable row level security;

drop policy if exists "user_contacts_select_own" on public.user_contacts;
create policy "user_contacts_select_own"
  on public.user_contacts for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "user_contacts_insert_own" on public.user_contacts;
create policy "user_contacts_insert_own"
  on public.user_contacts for insert to authenticated
  with check (owner_id = auth.uid() and contact_id <> auth.uid());

drop policy if exists "user_contacts_delete_own" on public.user_contacts;
create policy "user_contacts_delete_own"
  on public.user_contacts for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "user_contacts_update_own" on public.user_contacts;
create policy "user_contacts_update_own"
  on public.user_contacts for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

grant select, insert, update, delete on table public.user_contacts to authenticated;

create or replace function public.match_profiles_by_phones(phones text[])
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  phone text,
  last_seen_at timestamptz,
  matched_phone text
)
language sql
security definer
set search_path = public
as $$
  with wanted as (
    select distinct regexp_replace(p, '\D', '', 'g') as digits
    from unnest(phones) as p
    where length(regexp_replace(p, '\D', '', 'g')) >= 8
  )
  select
    pr.id,
    pr.username,
    pr.display_name,
    pr.avatar_url,
    pr.phone,
    pr.last_seen_at,
    regexp_replace(coalesce(pr.phone, ''), '\D', '', 'g') as matched_phone
  from public.profiles pr
  join wanted w
    on regexp_replace(coalesce(pr.phone, ''), '\D', '', 'g') = w.digits
    or (
      length(w.digits) >= 9
      and right(regexp_replace(coalesce(pr.phone, ''), '\D', '', 'g'), 9) = right(w.digits, 9)
    )
  where pr.id <> auth.uid();
$$;

revoke all on function public.match_profiles_by_phones(text[]) from public;
grant execute on function public.match_profiles_by_phones(text[]) to authenticated;

create or replace function public.find_profile_by_username(uname text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  banner_url text,
  phone text,
  last_seen_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    case when p.show_username or p.id = auth.uid() then p.username else null end,
    p.display_name,
    case when p.show_avatar or p.id = auth.uid() then p.avatar_url else null end,
    case when p.show_banner or p.id = auth.uid() then p.banner_url else null end,
    case when p.show_phone or p.id = auth.uid() then p.phone else null end,
    case when p.show_last_seen or p.id = auth.uid() then p.last_seen_at else null end
  from public.profiles p
  where lower(p.username) = lower(trim(both from uname))
  limit 1;
$$;

revoke all on function public.find_profile_by_username(text) from public;
grant execute on function public.find_profile_by_username(text) to authenticated;

create or replace function public.get_public_profile(target_id uuid)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  banner_url text,
  phone text,
  last_seen_at timestamptz,
  show_read_receipts boolean
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    case when p.show_username or p.id = auth.uid() then p.username else null end,
    p.display_name,
    case when p.show_avatar or p.id = auth.uid() then p.avatar_url else null end,
    case when p.show_banner or p.id = auth.uid() then p.banner_url else null end,
    case when p.show_phone or p.id = auth.uid() then p.phone else null end,
    case when p.show_last_seen or p.id = auth.uid() then p.last_seen_at else null end,
    p.show_read_receipts
  from public.profiles p
  where p.id = target_id;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to authenticated;
