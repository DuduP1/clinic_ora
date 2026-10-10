-- =============================================================
-- CRM קליניקת אורה – סכמה ראשונית (PRD סעיפים 8–9)
-- =============================================================

-- ---------- Enums ----------
create type public.staff_role         as enum ('admin', 'staff');
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled'); -- עתידי / בוצע / בוטל
create type public.ticket_status      as enum ('new', 'in_progress', 'closed');        -- חדשה / בטיפול / נסגרה
create type public.ticket_source      as enum ('manual', 'agent');

-- ---------- נרמול טלפון ----------
-- ספרות בלבד, קידומת 0: "+972-54-782-1390" → "0547821390"
create or replace function public.normalize_phone(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d = '' then null
    when d like '972%' then '0' || substr(d, 4)
    when d like '0%'   then d
    else '0' || d
  end
  from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as d) s;
$$;

-- ---------- טבלאות ----------
create table public.staff (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (length(trim(full_name)) > 0),
  email       text not null unique,
  role        public.staff_role not null default 'staff',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null check (length(trim(full_name)) > 0),
  phone       text not null unique check (phone ~ '^0[0-9]{8,9}$'),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.treatments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  price         numeric(10, 2) not null check (price >= 0),
  duration_min  integer not null check (duration_min > 0),
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.appointments (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers (id) on delete restrict,
  treatment_id  uuid not null references public.treatments (id) on delete restrict,
  staff_id      uuid references public.staff (id) on delete set null,
  starts_at     timestamptz not null,
  status        public.appointment_status not null default 'scheduled',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index appointments_customer_idx on public.appointments (customer_id, starts_at);
create index appointments_starts_idx   on public.appointments (starts_at);

create table public.service_tickets (
  id             uuid primary key default gen_random_uuid(),
  ticket_number  bigint generated always as identity (start with 1001) unique,
  customer_id    uuid not null references public.customers (id) on delete restrict,
  description    text not null check (length(trim(description)) > 0),
  status         public.ticket_status not null default 'new',
  assigned_to    uuid references public.staff (id) on delete set null,
  source         public.ticket_source not null default 'manual',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  closed_at      timestamptz,
  -- PRD 8.4: מעבר ל"בטיפול" מחייב אחראית
  constraint in_progress_requires_assignee check (status <> 'in_progress' or assigned_to is not null)
);
create index service_tickets_customer_idx on public.service_tickets (customer_id);
create index service_tickets_status_idx   on public.service_tickets (status, assigned_to);

-- ---------- טריגרים ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger customers_updated_at    before update on public.customers       for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments    for each row execute function public.set_updated_at();
create trigger tickets_updated_at      before update on public.service_tickets for each row execute function public.set_updated_at();

-- נרמול טלפון אוטומטי בכל שמירה (PRD 10.2)
create or replace function public.customers_normalize_phone()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.phone := public.normalize_phone(new.phone);
  new.full_name := trim(new.full_name);
  return new;
end;
$$;

create trigger customers_phone_normalize before insert or update of phone, full_name on public.customers
  for each row execute function public.customers_normalize_phone();

-- זמן סגירה אוטומטי (PRD 8.4)
create or replace function public.tickets_closed_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = 'closed' and (tg_op = 'INSERT' or old.status <> 'closed') then
    new.closed_at := now();
  elsif new.status <> 'closed' then
    new.closed_at := null;
  end if;
  return new;
end;
$$;

create trigger tickets_closed_at before insert or update of status on public.service_tickets
  for each row execute function public.tickets_closed_at();

-- ---------- תצוגת לקוחות עם התור הבא ומספר פניות פתוחות ----------
create view public.customers_overview
with (security_invoker = true) as
select
  c.*,
  (select min(a.starts_at) from public.appointments a
    where a.customer_id = c.id and a.status = 'scheduled' and a.starts_at > now()) as next_appointment_at,
  (select count(*) from public.service_tickets t
    where t.customer_id = c.id and t.status <> 'closed')::int as open_tickets
from public.customers c;
