import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSampleCases } from "@/lib/demo/sample-cases";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cases = await getSampleCases();

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <section className="rounded-[2rem] border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] px-6 py-5 shadow-[0_18px_60px_rgba(27,44,52,0.12)] sm:px-8">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-label">Practitioner Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Submitted encounters on the left. Full SOAP workspace on the right.
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)] xl:text-right">
            Select a patient from the encounter panel to review the processed
            intake, assessment context, appointment request, and structured SOAP
            draft.
          </p>
        </div>
      </section>

      <DashboardShell cases={cases} />
    </div>
  );
}
