import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSampleCases } from "@/lib/demo/sample-cases";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cases = await getSampleCases();

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10 2xl:px-14">
      <section className="rounded-[2rem] border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] px-6 py-6 shadow-[0_18px_60px_rgba(27,44,52,0.12)] sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="max-w-4xl">
            <p className="section-label">Practitioner Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-[2.65rem] xl:text-[2.95rem]">
              Submitted encounters on the left. Full SOAP workspace on the right.
            </h1>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--muted)] 2xl:text-right">
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
