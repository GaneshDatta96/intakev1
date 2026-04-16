import { PatientIntakeExperience } from "@/components/intake/patient-intake-experience";

export default async function QuestionnairePage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string | string[] }>;
}) {
  const params = await searchParams;
  const patientId =
    typeof params.patientId === "string" ? params.patientId : null;

  return <PatientIntakeExperience initialPatientId={patientId} />;
}
