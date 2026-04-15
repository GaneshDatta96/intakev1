create extension if not exists pgcrypto;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  dob date,
  sex_at_birth text,
  gender_identity text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  status text not null default 'draft',
  chief_complaint text not null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  schema_version text not null,
  raw_json jsonb not null,
  normalized_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null references public.encounters(id) on delete cascade,
  pattern_key text not null,
  confidence numeric(4, 2) not null,
  evidence jsonb not null default '[]'::jsonb,
  data_gaps jsonb not null default '[]'::jsonb,
  risk_level text not null,
  rank integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.soap_notes (
  id uuid primary key default gen_random_uuid(),
  encounter_id uuid not null unique references public.encounters(id) on delete cascade,
  subjective text not null,
  objective text not null,
  assessment text not null,
  plan text not null,
  soap_json jsonb not null,
  prompt_version text not null,
  model text not null,
  review_status text not null default 'draft',
  created_at timestamptz not null default now()
);

create index if not exists encounters_patient_status_idx
  on public.encounters (patient_id, status, submitted_at desc nulls last);

create index if not exists assessment_results_encounter_rank_idx
  on public.assessment_results (encounter_id, rank);
