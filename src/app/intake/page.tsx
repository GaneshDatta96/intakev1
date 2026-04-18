import Link from "next/link";
import { getDemoClinics } from "@/lib/clinics/store";

export default async function IntakeDirectoryPage() {
  const clinics = await getDemoClinics();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-3">
          <p className="section-label">Clinic Demos</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Choose or create a clinic-specific intake route.
          </h1>
          <p className="max-w-4xl leading-7 text-[color:var(--muted)]">
            Demo routes can come from local presets or Supabase-backed clinic
            rows. Each route loads a niche-specific questionnaire and SOAP
            structure while keeping Plan manual for clinician review.
          </p>
        </div>
        <div className="mt-6">
          <Link
            href="/create-demo"
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92"
          >
            Create Demo Route
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {clinics.map((clinic) => (
          <Link
            key={clinic.slug}
            href={`/${clinic.slug}`}
            className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="section-label">{clinic.config.label}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
              {clinic.clinicName}
            </h2>
            <p className="mt-3 leading-7 text-[color:var(--muted)]">
              {clinic.headline}
            </p>
            {clinic.location || clinic.country ? (
              <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
                {[clinic.location, clinic.country].filter(Boolean).join(" • ")}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              {clinic.config.soap.A.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
