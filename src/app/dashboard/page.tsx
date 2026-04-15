import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSampleCases } from "@/lib/demo/sample-cases";

export default async function DashboardPage() {
    const cases = await getSampleCases();
    return (
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
            <DashboardShell cases={cases} />
        </div>
    )
}
