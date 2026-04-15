import { buildFallbackSoap } from "@/lib/ai/generate-soap";
import { normalizeIntakeSubmission } from "@/lib/assessment/normalize-intake";
import { scorePatterns } from "@/lib/assessment/score-patterns";
import { type IntakeFormInput } from "@/lib/schemas/intake";

const sampleIntakes: IntakeFormInput[] = [
  {
    patient_info: {
      first_name: "Maria",
      last_name: "Cole",
      age: 42,
      sex_at_birth: "Female",
      gender_identity: "Female",
      phone: "(555) 014-3377",
      email: "maria@example.com",
    },
    chief_complaint: {
      primary_issue: "Bloating and irregular bowel habits",
      duration: "4 months",
      severity_0_10: 7,
      onset: "Gradual",
      aggravating_factors: "large meals, stress",
      relieving_factors: "lighter meals, rest",
    },
    symptom_keys: ["bloating", "gas", "brain_fog", "high_stress"],
    custom_symptoms: "Loose stools after restaurant meals",
    history: {
      conditions: "Seasonal allergies",
      medications: "Recent antibiotics",
      surgeries: "",
      family_history: "Mother with IBS",
    },
    lifestyle: {
      diet: "Frequent takeout and sugary snacks during busy weeks",
      exercise: "Minimal exercise",
      sleep: "Broken sleep 5-6 hours",
      stress: "High stress at work",
      substance_use: "2 coffees daily, social alcohol",
    },
    goals: {
      patient_priorities: "reduce bloating, improve energy",
      expectations: "understand triggers and get a clear plan",
    },
    metadata: {
      source: "demo",
    },
  },
  {
    patient_info: {
      first_name: "David",
      last_name: "Reed",
      age: 51,
      sex_at_birth: "Male",
      gender_identity: "Male",
      phone: "(555) 010-0202",
      email: "david@example.com",
    },
    chief_complaint: {
      primary_issue: "Persistent low back pain after long desk days",
      duration: "6 weeks",
      severity_0_10: 8,
      onset: "After a long travel week",
      aggravating_factors: "sitting, lifting",
      relieving_factors: "walking, stretching",
    },
    symptom_keys: ["low_back_pain", "neck_pain", "poor_sleep"],
    custom_symptoms: "Tightness into right hip",
    history: {
      conditions: "Prior episodic back strain",
      medications: "Ibuprofen as needed",
      surgeries: "",
      family_history: "Father with diabetes",
    },
    lifestyle: {
      diet: "Skipped meals and late takeout",
      exercise: "Sedentary during work week",
      sleep: "Poor sleep due to discomfort",
      stress: "Moderate to high stress",
      substance_use: "Occasional alcohol",
    },
    goals: {
      patient_priorities: "reduce pain, sleep better, return to workouts",
      expectations: "get a practical treatment direction",
    },
    metadata: {
      source: "demo",
    },
  },
];

export function buildSampleCases() {
  return sampleIntakes.map((raw, index) => {
    const normalized = normalizeIntakeSubmission(raw);
    const assessmentResults = scorePatterns(normalized);
    const soap = buildFallbackSoap(normalized, assessmentResults);

    return {
      id: `demo-${index + 1}`,
      patientName: `${normalized.patient_info.first_name} ${normalized.patient_info.last_name}`,
      chiefComplaint: normalized.chief_complaint.primary_issue,
      normalized,
      assessmentResults,
      soap,
      submittedAt: normalized.metadata.submitted_at,
    };
  });
}

export type DashboardCase = ReturnType<typeof buildSampleCases>[number];
