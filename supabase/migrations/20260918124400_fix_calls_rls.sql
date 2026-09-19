-- Allow authenticated users to create and update their calls.

grant select, insert, update on table public.calls to authenticated;

drop policy if exists "calls_select_participant" on public.calls;
create policy "calls_select_participant"
  on public.calls for select
  to authenticated
  using (caller_id = auth.uid() or callee_id = auth.uid());

drop policy if exists "calls_insert_caller" on public.calls;
create policy "calls_insert_caller"
  on public.calls for insert
  to authenticated
  with check (caller_id = auth.uid() and caller_id <> callee_id);

drop policy if exists "calls_update_participant" on public.calls;
create policy "calls_update_participant"
  on public.calls for update
  to authenticated
  using (caller_id = auth.uid() or callee_id = auth.uid())
  with check (caller_id = auth.uid() or callee_id = auth.uid());
