import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardCases } from "@/lib/dashboard/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cases = await getDashboardCases();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <p className="section-label">Practitioner Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Review submitted patients and open their structured SOAP view
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-[color:var(--muted)]">
          Each patient intake is processed into a normalized record, scored for
          relevant patterns, and surfaced here for practitioner review.
        </p>
      </div>

      <DashboardShell cases={cases} />
    </div>
  );
}
