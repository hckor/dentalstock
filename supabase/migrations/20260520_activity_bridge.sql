-- DentalStock activity bridge
-- Adds stable legacy ids for client-created notifications and read-state syncing.

alter table public.notifs
  add column if not exists legacy_id text,
  add column if not exists app_data jsonb not null default '{}'::jsonb;

create unique index if not exists notifs_clinic_legacy_id_idx
on public.notifs (clinic_id, legacy_id);

drop policy if exists "members can create notifications" on public.notifs;
create policy "members can create notifications"
on public.notifs for insert
with check (public.is_clinic_member(clinic_id));

drop policy if exists "members can update clinic notifications" on public.notifs;
create policy "members can update clinic notifications"
on public.notifs for update
using (public.is_clinic_member(clinic_id))
with check (public.is_clinic_member(clinic_id));

drop policy if exists "members can create audit logs" on public.audit_logs;
create policy "members can create audit logs"
on public.audit_logs for insert
with check (public.is_clinic_member(clinic_id));
