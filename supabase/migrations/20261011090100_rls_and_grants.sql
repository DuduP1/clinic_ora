-- =============================================================
-- הרשאות (PRD סעיף 7): כל הצוות הפעיל רואה, יוצר ומעדכן.
-- מחיקה וניהול צוות: מנהלת בלבד. אנונימיים: ללא גישה.
-- =============================================================

-- ---------- פונקציות עזר ----------
create or replace function public.is_active_staff()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s where s.id = auth.uid() and s.is_active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s where s.id = auth.uid() and s.is_active and s.role = 'admin'
  );
$$;

-- ---------- Grants (חשיפת טבלאות אוטומטית כבויה בפרויקט) ----------
grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on
  public.staff, public.customers, public.treatments, public.appointments, public.service_tickets
  to authenticated, service_role;
grant select on public.customers_overview to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

grant execute on function public.normalize_phone(text) to authenticated, service_role;
grant execute on function public.is_active_staff()     to authenticated;
grant execute on function public.is_admin()            to authenticated;

-- ---------- RLS ----------
alter table public.staff           enable row level security;
alter table public.customers       enable row level security;
alter table public.treatments      enable row level security;
alter table public.appointments    enable row level security;
alter table public.service_tickets enable row level security;

-- staff
create policy staff_select on public.staff for select to authenticated using (public.is_active_staff());
create policy staff_insert on public.staff for insert to authenticated with check (public.is_admin());
create policy staff_update on public.staff for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy staff_delete on public.staff for delete to authenticated using (public.is_admin());

-- treatments (מחירון): צוות קורא, מנהלת עורכת
create policy treatments_select on public.treatments for select to authenticated using (public.is_active_staff());
create policy treatments_write  on public.treatments for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- customers / appointments / service_tickets
create policy customers_select on public.customers for select to authenticated using (public.is_active_staff());
create policy customers_insert on public.customers for insert to authenticated with check (public.is_active_staff());
create policy customers_update on public.customers for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy customers_delete on public.customers for delete to authenticated using (public.is_admin());

create policy appointments_select on public.appointments for select to authenticated using (public.is_active_staff());
create policy appointments_insert on public.appointments for insert to authenticated with check (public.is_active_staff());
create policy appointments_update on public.appointments for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy appointments_delete on public.appointments for delete to authenticated using (public.is_admin());

create policy tickets_select on public.service_tickets for select to authenticated using (public.is_active_staff());
create policy tickets_insert on public.service_tickets for insert to authenticated with check (public.is_active_staff());
create policy tickets_update on public.service_tickets for update to authenticated using (public.is_active_staff()) with check (public.is_active_staff());
create policy tickets_delete on public.service_tickets for delete to authenticated using (public.is_admin());
