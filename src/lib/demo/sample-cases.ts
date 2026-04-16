import { type DashboardCase } from "@/lib/schemas/modern-soap";

const sampleCases: DashboardCase[] = [
  {
    id: "pa-1",
    patient: { first_name: "Maria", last_name: "Cole", email: "maria.cole@example.com" },
    submitted_at: "2026-04-10T10:00:00Z",
    subjective: {
      chief_complaint: { summary: "Annual check-up & medication review" },
      history_of_present_illness: { summary: "Patient feels generally well. Reports occasional stress-related headaches." },
      review_of_systems: { summary: "General: No fever, chills. CV: No chest pain. Resp: No SOB." },
      past_medical_history: { summary: "Hypertension (diagnosed 2022), Hyperlipidemia (diagnosed 2022)" },
      medications: { summary: "Lisinopril 10mg daily, Atorvastatin 20mg daily" },
      social_history: {
          environment: { summary: "Stable housing, Accountant, No SDOH, No Exposures" },
          body: { summary: "Balanced diet, walks 30 mins 3x/week, no substance use" },
          mind: { summary: "High stress during tax season, good family support, stable relationships" },
        },
    },
    objective: {
      demographics: { summary: "Age 42" },
      vitals: { summary: "BP 130/85, HR 72, Wt 150 lbs, Ht 5'5\"" },
      physical_exam: { summary: "WDL" },
      labs_and_imaging: { summary: "A1c 5.5%, Lipid Panel: LDL 95, HDL 50, Total 160" },
      risk_scores: { summary: "ASCVD 2.5% (Low)" },
    },
    assessments: [
      {
        id: "as-1-1",
        diagnosis: "Hypertension",
        icd_code: "I10",
        status: "Controlled",
        severity: "Stage 1",
        modifiers: { summary: "Hyperlipidemia, Family history, Good adherence" },
        plan: {
          medications: { summary: "Continue Lisinopril 10mg daily." },
          testing: { summary: "Lipid panel annually." },
          referrals: { summary: "None needed." },
          lifestyle: { summary: "Counsel on continued low sodium diet. Encourage increase to 5x/week. Discuss stress management techniques." },
          monitoring: { summary: "Check BP weekly. Report any dizziness." },
          follow_up: { summary: "3 months. Goal: BP < 130/80" },
          preventive_care: { summary: "Annual flu shot." },
        },
      },
      {
        id: "as-1-2",
        diagnosis: "Hyperlipidemia",
        icd_code: "E78.5",
        status: "Controlled",
        severity: "Moderate Risk",
        modifiers: { summary: "Hypertension, Good adherence" },
        plan: {
          medications: { summary: "Continue Atorvastatin 20mg daily." },
          testing: { summary: "None needed at this time." },
          referrals: { summary: "None" },
          lifestyle: { summary: "Reinforce heart-healthy diet." },
          monitoring: { summary: "Annual lipid panel. Report muscle pain." },
          follow_up: { summary: "3 months. Goal: LDL < 100" },
          preventive_care: { summary: "Discussed aspirin therapy, patient declined." },
        },
      },
    ],
  },
];

export async function getSampleCases(): Promise<DashboardCase[]> {
  return Promise.resolve(sampleCases);
}
