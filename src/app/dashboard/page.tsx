import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { buildSampleCases } from "@/lib/demo/sample-cases";

export default function DashboardPage() {
  const cases = buildSampleCases();

  return <DashboardShell cases={cases} />;
}
