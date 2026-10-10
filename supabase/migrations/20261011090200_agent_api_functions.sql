-- =============================================================
-- פונקציות לסוכן ה-AI (PRD סעיף 10). נקראות רק מצד השרת
-- (api/agent/*) עם המפתח הסודי – אין הרשאת הרצה לצוות או לאנונימיים.
-- =============================================================

-- א. פתיחת פנייה – אטומית: איתור/יצירת לקוחה + פנייה, או כלום.
create or replace function public.agent_create_ticket(p_name text, p_phone text, p_description text)
returns table (ticket_number bigint, customer_existing boolean)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_phone      text := public.normalize_phone(p_phone);
  v_customer_id uuid;
  v_existing    boolean := true;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_description), '') = '' then
    raise exception 'missing_fields' using errcode = '22023';
  end if;
  if v_phone is null or v_phone !~ '^0[0-9]{8,9}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  select c.id into v_customer_id from public.customers c where c.phone = v_phone;

  if v_customer_id is null then
    v_existing := false;
    insert into public.customers (full_name, phone)
    values (trim(p_name), v_phone)
    returning id into v_customer_id;
  end if; -- לקוחה קיימת: השם הקיים לא נדרס (PRD 8.7)

  return query
  insert into public.service_tickets (customer_id, description, status, source)
  values (v_customer_id, trim(p_description), 'new', 'agent')
  returning service_tickets.ticket_number, v_existing;
end;
$$;

-- ב. התור הבא – status = scheduled ו-starts_at > now(), הקרוב ביותר (PRD 8.5)
create or replace function public.agent_next_appointment(p_phone text)
returns table (starts_at timestamptz, treatment_name text)
language sql
stable
set search_path = ''
as $$
  select a.starts_at, t.name
  from public.customers c
  join public.appointments a on a.customer_id = c.id
  join public.treatments t   on t.id = a.treatment_id
  where c.phone = public.normalize_phone(p_phone)
    and a.status = 'scheduled'
    and a.starts_at > now()
  order by a.starts_at
  limit 1;
$$;

revoke execute on function public.agent_create_ticket(text, text, text) from public, anon, authenticated;
revoke execute on function public.agent_next_appointment(text)          from public, anon, authenticated;
grant  execute on function public.agent_create_ticket(text, text, text) to service_role;
grant  execute on function public.agent_next_appointment(text)          to service_role;
