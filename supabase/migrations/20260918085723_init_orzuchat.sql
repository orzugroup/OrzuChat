-- OrzuChat core schema: profiles, 1:1 chats, media, calls, receipts.
-- RLS on every public table. SECURITY DEFINER helpers live in private.

create schema if not exists private;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null default '',
  avatar_url text,
  phone text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,32}$')
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid not null references public.profiles (id),
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.direct_pairs (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid not null unique references public.conversations (id) on delete cascade,
  primary key (user_a, user_b),
  constraint direct_pairs_ordered check (user_a < user_b)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  type text not null check (type in ('text', 'voice', 'image', 'video', 'file', 'system')),
  body text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  bucket text not null default 'media',
  path text not null,
  mime text not null,
  size_bytes bigint,
  duration_ms integer,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create table public.message_receipts (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (message_id, user_id)
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations (id) on delete set null,
  caller_id uuid not null references public.profiles (id),
  callee_id uuid not null references public.profiles (id),
  kind text not null check (kind in ('audio', 'video')),
  status text not null check (status in ('ringing', 'accepted', 'rejected', 'missed', 'ended', 'busy')),
  room_name text not null unique,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

create index conversation_members_user_idx
  on public.conversation_members (user_id);

create index calls_participant_status_idx
  on public.calls (callee_id, status, created_at desc);

create index calls_caller_status_idx
  on public.calls (caller_id, status, created_at desc);

create index devices_user_idx
  on public.devices (user_id);

create index profiles_username_idx
  on public.profiles (username);

create index attachments_message_idx
  on public.attachments (message_id);

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_conversation_member(cid uuid, uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = cid
      and user_id = uid
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  generated_username text;
begin
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user'
  );

  generated_username := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '', 'g'));
  if generated_username is null or length(generated_username) < 3 then
    generated_username := 'user';
  end if;
  generated_username := left(generated_username, 23) || '_' || substr(replace(new.id::text, '-', ''), 1, 8);

  insert into public.profiles (id, username, display_name, phone)
  values (
    new.id,
    generated_username,
    base_name,
    new.phone
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function private.create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  conv_id uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if other_user_id is null or other_user_id = me then
    raise exception 'invalid user';
  end if;
  if not exists (select 1 from public.profiles where id = other_user_id) then
    raise exception 'user not found';
  end if;

  if me < other_user_id then
    a := me;
    b := other_user_id;
  else
    a := other_user_id;
    b := me;
  end if;

  select conversation_id into conv_id
  from public.direct_pairs
  where user_a = a and user_b = b;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.conversations (created_by, is_group)
  values (me, false)
  returning id into conv_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (conv_id, me), (conv_id, other_user_id);

  insert into public.direct_pairs (user_a, user_b, conversation_id)
  values (a, b, conv_id);

  return conv_id;
end;
$$;

create or replace function private.on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;

  insert into public.message_receipts (message_id, user_id)
  select new.id, cm.user_id
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.user_id <> new.sender_id;

  return new;
end;
$$;

create or replace function public.create_direct_conversation(other_user_id uuid)
returns uuid
language sql
security definer
set search_path = public, private
as $$
  select private.create_direct_conversation(other_user_id);
$$;

create or replace function public.mark_conversation_read(cid uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.conversation_members
  set last_read_at = now()
  where conversation_id = cid
    and user_id = auth.uid();

  update public.message_receipts mr
  set read_at = coalesce(mr.read_at, now()),
      delivered_at = coalesce(mr.delivered_at, now())
  from public.messages m
  where mr.message_id = m.id
    and m.conversation_id = cid
    and mr.user_id = auth.uid()
    and mr.read_at is null;
end;
$$;

create or replace function public.mark_messages_delivered(message_ids uuid[])
returns void
language sql
security invoker
set search_path = public
as $$
  update public.message_receipts
  set delivered_at = coalesce(delivered_at, now())
  where user_id = auth.uid()
    and message_id = any (message_ids)
    and delivered_at is null;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function private.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger on_message_insert
  after insert on public.messages
  for each row execute function private.on_message_insert();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.direct_pairs enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.message_receipts enable row level security;
alter table public.calls enable row level security;
alter table public.devices enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "conversations_select_member"
  on public.conversations for select
  to authenticated
  using (private.is_conversation_member(id));

create policy "conversations_insert_own"
  on public.conversations for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "conversations_update_member"
  on public.conversations for update
  to authenticated
  using (private.is_conversation_member(id))
  with check (private.is_conversation_member(id));

create policy "members_select_own_conversations"
  on public.conversation_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or private.is_conversation_member(conversation_id)
  );

create policy "members_insert_self"
  on public.conversation_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "members_update_self"
  on public.conversation_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "direct_pairs_select_self"
  on public.direct_pairs for select
  to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

create policy "messages_select_member"
  on public.messages for select
  to authenticated
  using (private.is_conversation_member(conversation_id));

create policy "messages_insert_member"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and private.is_conversation_member(conversation_id)
  );

create policy "messages_update_own"
  on public.messages for update
  to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create policy "attachments_select_member"
  on public.attachments for select
  to authenticated
  using (
    exists (
      select 1
      from public.messages m
      where m.id = attachments.message_id
        and private.is_conversation_member(m.conversation_id)
    )
  );

create policy "attachments_insert_sender"
  on public.attachments for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.messages m
      where m.id = attachments.message_id
        and m.sender_id = auth.uid()
        and private.is_conversation_member(m.conversation_id)
    )
  );

create policy "receipts_select_member"
  on public.message_receipts for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.messages m
      where m.id = message_receipts.message_id
        and private.is_conversation_member(m.conversation_id)
    )
  );

create policy "receipts_update_own"
  on public.message_receipts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "calls_select_participant"
  on public.calls for select
  to authenticated
  using (caller_id = auth.uid() or callee_id = auth.uid());

create policy "calls_insert_caller"
  on public.calls for insert
  to authenticated
  with check (caller_id = auth.uid() and caller_id <> callee_id);

create policy "calls_update_participant"
  on public.calls for update
  to authenticated
  using (caller_id = auth.uid() or callee_id = auth.uid())
  with check (caller_id = auth.uid() or callee_id = auth.uid());

create policy "devices_select_own"
  on public.devices for select
  to authenticated
  using (user_id = auth.uid());

create policy "devices_insert_own"
  on public.devices for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "devices_update_own"
  on public.devices for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "devices_delete_own"
  on public.devices for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.messages replica identity full;
alter table public.calls replica identity full;
alter table public.message_receipts replica identity full;
alter table public.conversation_members replica identity full;
alter table public.profiles replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'calls'
  ) then
    alter publication supabase_realtime add table public.calls;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'message_receipts'
  ) then
    alter publication supabase_realtime add table public.message_receipts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversation_members'
  ) then
    alter publication supabase_realtime add table public.conversation_members;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('media', 'media', false, 52428800),
  ('avatars', 'avatars', true, 5242880)
on conflict (id) do nothing;

create policy "media_insert_own_prefix"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media');

create policy "media_update_own_prefix"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media_delete_own_prefix"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema private to postgres, service_role, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.conversations to authenticated;
grant select, insert, update on table public.conversation_members to authenticated;
grant select on table public.direct_pairs to authenticated;
grant select, insert, update on table public.messages to authenticated;
grant select, insert on table public.attachments to authenticated;
grant select, update on table public.message_receipts to authenticated;
grant select, insert, update on table public.calls to authenticated;
grant select, insert, update, delete on table public.devices to authenticated;

grant execute on function public.create_direct_conversation(uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.mark_messages_delivered(uuid[]) to authenticated;
grant execute on function private.create_direct_conversation(uuid) to authenticated;
grant execute on function private.is_conversation_member(uuid, uuid) to authenticated;

insert into public.profiles (id, username, display_name, phone)
select
  u.id,
  left(
    coalesce(
      nullif(lower(regexp_replace(coalesce(split_part(u.email, '@', 1), 'user'), '[^a-zA-Z0-9]', '', 'g')), ''),
      'user'
    ),
    23
  ) || '_' || substr(replace(u.id::text, '-', ''), 1, 8),
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'user'
  ),
  u.phone
from auth.users u
on conflict (id) do nothing;
