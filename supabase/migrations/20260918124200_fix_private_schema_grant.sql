-- Fix: "permission denied for schema private"
-- Run in SQL Editor of project rmvlpxryyxxdjmclqhaa.

grant usage on schema private to authenticated;

create or replace function public.create_direct_conversation(other_user_id uuid)
returns uuid
language sql
security definer
set search_path = public, private
as $$
  select private.create_direct_conversation(other_user_id);
$$;

revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;
grant execute on function private.create_direct_conversation(uuid) to authenticated;
grant execute on function private.is_conversation_member(uuid, uuid) to authenticated;
