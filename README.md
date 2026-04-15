# Intake V1

Focused V1 for outpatient clinics:

- structured patient intake
- deterministic pattern scoring
- AI-assisted SOAP drafting for `S + partial O + A`
- manually reviewed `P`

## Stack

- Next.js 16 App Router
- Supabase Postgres
- OpenRouter for structured SOAP drafting
- Route handlers for the V1 workflow API

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env vars:

```bash
cp .env.example .env.local
```

3. Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

4. Start the app:

```bash
npm run dev
```

## Main Routes

- `/` landing page
- `/intake` public patient intake link
- `/questionnaire` alias for the patient intake link
- `/dashboard` practitioner dashboard for submitted encounters
- `/api/intake/submit`
- `/api/encounters/:id/appointment-request`
- `/api/encounters/:id/assess`
- `/api/encounters/:id/generate-soap`
- `/api/health`

## Supabase

Migration files live in [supabase/migrations/20260415070000_init.sql](./supabase/migrations/20260415070000_init.sql).

Typical flow after authenticating the Supabase CLI:

```bash
npm run supabase:init
npx supabase login
npx supabase projects create intake-v1
npx supabase link --project-ref <your-project-ref>
npm run supabase:push
```

## Logging

Structured request logging is mandatory in this project.

- API routes log start, completion, degraded mode, and error states
- logs are emitted as structured JSON
- raw PHI and full prompts should not be logged

## Deployment

After creating the Supabase project and setting env vars:

```bash
npx vercel login
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add SUPABASE_URL
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel env add OPENROUTER_API_KEY
npx vercel env add OPENROUTER_MODEL
npx vercel --prod
```

## Notes

- If Supabase env vars are missing, the app still runs in local workflow mode with demo dashboard fallback data.
- If `OPENROUTER_API_KEY` is missing, SOAP generation falls back to a deterministic template.
