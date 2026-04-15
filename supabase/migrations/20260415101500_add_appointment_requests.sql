create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null unique references public.encounters(id) on delete cascade,
  preferred_day text not null,
  preferred_time text not null,
  notes text not null default '',
  status text not null default 'requested',
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists appointment_requests_status_idx
  on public.appointment_requests (status, requested_at desc);
