-- PROPOSED ONLY: requires owner's approval before applying to aypxpsuzobcjoiquucws.
-- No existing table or policy is altered. Fail if kasa_state already exists.
begin;
create table public.kasa_state (
 user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 data jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.kasa_state enable row level security;
revoke all on public.kasa_state from anon;
grant select, insert, update, delete on public.kasa_state to authenticated;
create policy kasa_state_select_own on public.kasa_state for select to authenticated using (user_id = (select auth.uid()));
create policy kasa_state_insert_own on public.kasa_state for insert to authenticated with check (user_id = (select auth.uid()));
create policy kasa_state_update_own on public.kasa_state for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy kasa_state_delete_own on public.kasa_state for delete to authenticated using (user_id = (select auth.uid()));
commit;
