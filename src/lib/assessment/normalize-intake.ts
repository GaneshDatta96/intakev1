import {
  intakeFormSchema,
  normalizedIntakeSchema,
  symptomCatalog,
  type IntakeFormInput,
  type NormalizedIntake,
} from "@/lib/schemas/intake";

const symptomMap = new Map<string, string>(
  symptomCatalog.map((item) => [item.key, item.label]),
);

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function collectRedFlags(symptomKeys: string[], customSymptoms: string) {
  const redFlags = new Set<string>();
  const lowerCustomSymptoms = customSymptoms.toLowerCase();

  ["blood_in_stool", "unintentional_weight_loss", "numbness_weakness"].forEach(
    (key) => {
      if (symptomKeys.includes(key)) {
        redFlags.add(key);
      }
    },
  );

  if (lowerCustomSymptoms.includes("chest pain")) redFlags.add("chest_pain");
  if (lowerCustomSymptoms.includes("shortness of breath")) {
    redFlags.add("shortness_of_breath");
  }
  if (lowerCustomSymptoms.includes("fainting")) redFlags.add("syncope");

  return Array.from(redFlags);
}

export function normalizeIntakeSubmission(input: IntakeFormInput): NormalizedIntake {
  const parsed = intakeFormSchema.parse(input);
  const customSymptomEntries = splitList(parsed.custom_symptoms);

  const symptoms = [
    ...parsed.symptom_keys.map((key) => ({
      key,
      label: symptomMap.get(key) ?? key.replaceAll("_", " "),
      severity_0_10: parsed.chief_complaint.severity_0_10,
      frequency: "reported",
      duration: parsed.chief_complaint.duration,
      custom_text: "",
    })),
    ...customSymptomEntries.map((value) => ({
      key: value.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      label: value,
      severity_0_10: parsed.chief_complaint.severity_0_10,
      frequency: "reported",
      duration: parsed.chief_complaint.duration,
      custom_text: value,
    })),
  ];

  const normalized: NormalizedIntake = {
    schema_version: "1.0.0",
    patient_info: {
      first_name: parsed.patient_info.first_name,
      last_name: parsed.patient_info.last_name,
      age: parsed.patient_info.age,
      sex_at_birth: parsed.patient_info.sex_at_birth,
      gender_identity: parsed.patient_info.gender_identity,
      contact: {
        phone: parsed.patient_info.phone,
        email: parsed.patient_info.email,
      },
    },
    chief_complaint: {
      primary_issue: parsed.chief_complaint.primary_issue,
      duration: parsed.chief_complaint.duration,
      severity_0_10: parsed.chief_complaint.severity_0_10,
      onset: parsed.chief_complaint.onset,
      aggravating_factors: splitList(parsed.chief_complaint.aggravating_factors),
      relieving_factors: splitList(parsed.chief_complaint.relieving_factors),
    },
    symptoms,
    history: {
      conditions: splitList(parsed.history.conditions),
      medications: splitList(parsed.history.medications),
      surgeries: splitList(parsed.history.surgeries),
      family_history: splitList(parsed.history.family_history),
    },
    lifestyle: parsed.lifestyle,
    goals: {
      patient_priorities: splitList(parsed.goals.patient_priorities),
      expectations: parsed.goals.expectations,
    },
    red_flags: collectRedFlags(parsed.symptom_keys, parsed.custom_symptoms),
    metadata: {
      source: parsed.metadata.source,
      submitted_at: new Date().toISOString(),
    },
  };

  return normalizedIntakeSchema.parse(normalized);
}
