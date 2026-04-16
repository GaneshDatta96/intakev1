export type DashboardCase = {
  id: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
  };
  submitted_at: string;
  subjective: {
    chief_complaint: string;
    history_of_present_illness: string;
    review_of_systems: string;
    past_medical_history: string;
    medications: string;
    social_history: {
      environment: { housing: string; occupation: string; sdoh: string; exposures: string; };
      body: { diet: string; exercise: string; substance_use: string; };
      mind: { stress: string; support: string; relationships: string; };
    };
  };
  objective: {
    demographics: { age: number; };
    vitals: string;
    physical_exam: string;
    labs: string;
    imaging: string;
    risk_scores: string;
  };
  assessments: {
    id: string;
    diagnosis: string;
    icd_code: string;
    status: string;
    severity: string;
    modifiers: { comorbidities: string; risk_factors: string; adherence: string; };
    plan: {
      medications: string;
      testing: string;
      referrals: string;
      lifestyle: { diet: string; exercise: string; stress: string; };
      monitoring: { home_bp: string; labs: string; symptoms: string; };
      follow_up: { timing: string; goals: string; };
      preventive_care: string;
    };
  }[];
};

const sampleCases: DashboardCase[] = [
  {
    id: "pa-1",
    patient: { first_name: "Maria", last_name: "Cole", email: "maria.cole@example.com" },
    submitted_at: "2026-04-10T10:00:00Z",
    subjective: {
      chief_complaint: "Annual check-up & medication review",
      history_of_present_illness: "Patient feels generally well. Reports occasional stress-related headaches.",
      review_of_systems: "General: No fever, chills. CV: No chest pain. Resp: No SOB.",
      past_medical_history: "Hypertension (diagnosed 2022), Hyperlipidemia (diagnosed 2022)",
      medications: "Lisinopril 10mg daily, Atorvastatin 20mg daily",
      social_history: {
        environment: { housing: "Stable housing", occupation: "Accountant", sdoh: "None reported", exposures: "None" },
        body: { diet: "Balanced, tries to limit sodium", exercise: "Walks 30 mins, 3x/week", substance_use: "None" },
        mind: { stress: "High during tax season", support: "Good family support", relationships: "Stable" },
      },
    },
    objective: {
      demographics: { age: 42 },
      vitals: "BP 130/85, HR 72, Wt 150 lbs, Ht 5'5\"",
      physical_exam: "WDL",
      labs: "A1c 5.5%, Lipid Panel: LDL 95, HDL 50, Total 160",
      imaging: "None recent",
      risk_scores: "ASCVD 2.5% (Low)",
    },
    assessments: [
      {
        id: "as-1-1",
        diagnosis: "Hypertension",
        icd_code: "I10",
        status: "Controlled",
        severity: "Stage 1",
        modifiers: { comorbidities: "Hyperlipidemia", risk_factors: "Family history", adherence: "Good" },
        plan: {
          medications: "Continue Lisinopril 10mg daily.",
          testing: "Lipid panel annually.",
          referrals: "None needed.",
          lifestyle: { diet: "Counsel on continued low sodium diet.", exercise: "Encourage increase to 5x/week.", stress: "Discuss stress management techniques." },
          monitoring: { home_bp: "Check BP weekly.", labs: "None", symptoms: "Report any dizziness." },
          follow_up: { timing: "3 months", goals: "BP < 130/80" },
          preventive_care: "Annual flu shot.",
        },
      },
      {
        id: "as-1-2",
        diagnosis: "Hyperlipidemia",
        icd_code: "E78.5",
        status: "Controlled",
        severity: "Moderate Risk",
        modifiers: { comorbidities: "Hypertension", risk_factors: "None", adherence: "Good" },
        plan: {
          medications: "Continue Atorvastatin 20mg daily.",
          testing: "None needed at this time.",
          referrals: "None",
          lifestyle: { diet: "Reinforce heart-healthy diet.", exercise: "As above.", stress: "As above." },
          monitoring: { labs: "Annual lipid panel.", home_bp: "N/A", symptoms: "Report muscle pain." },
          follow_up: { timing: "3 months", goals: "LDL < 100" },
          preventive_care: "Discussed aspirin therapy, patient declined.",
        },
      },
    ],
  },
];

export async function getSampleCases(): Promise<DashboardCase[]> {
  return Promise.resolve(sampleCases);
}
