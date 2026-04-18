import { notFound } from "next/navigation";
import { PatientIntakeExperience } from "@/components/intake/patient-intake-experience";
import { getClinicForSlug } from "@/lib/clinics/store";

export const dynamic = "force-dynamic";

export default async function ClinicIntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ patientId?: string | string[] }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const clinic = await getClinicForSlug(slug);

  if (!clinic) {
    notFound();
  }

  const patientId = typeof query.patientId === "string" ? query.patientId : null;

  return (
    <PatientIntakeExperience clinic={clinic} initialPatientId={patientId} />
  );
}
