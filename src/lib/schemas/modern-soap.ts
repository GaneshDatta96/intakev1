import { z } from "zod";

// Reusable schema for expandable items
const expandableString = z.object({
  summary: z.string(),
  details: z.string().optional(),
});

function requiredFreeText(fieldLabel: string, min = 2) {
  return z
    .string()
    .trim()
    .min(
      min,
      `Enter ${fieldLabel}. If it is not available, write "None" or "Not available".`,
    );
}

const requiredAge = z
  .coerce
  .number({
    message: "Enter the patient's age.",
  })
  .int("Age must be a whole number.")
  .min(0, "Age cannot be negative.")
  .max(120, "Enter a realistic age.");

// Subjective Schema
const subjectiveSocialHistorySchema = z.object({
  environment: expandableString,
  body: expandableString,
  mind: expandableString,
});

export const subjectiveNoteSchema = z.object({
  patient_id: z.string().uuid(),
  chief_complaint: expandableString,
  history_of_present_illness: expandableString,
  review_of_systems: expandableString,
  past_medical_history: expandableString,
  medications: expandableString,
  social_history: subjectiveSocialHistorySchema,
});

// Objective Schema
export const objectiveNoteSchema = z.object({
  demographics: expandableString,
  vitals: expandableString,
  physical_exam: expandableString,
  labs_and_imaging: expandableString,
  risk_scores: expandableString,
});

export const patientIntakeQuestionnaireSchema = z.object({
  patient_id: z.string().uuid(),
  subjective: z.object({
    chief_complaint: z.object({
      summary: requiredFreeText("the chief complaint", 8),
    }),
    history_of_present_illness: z.object({
      onset: requiredFreeText("when the problem started"),
      duration: requiredFreeText("how long the problem has been present"),
      course: requiredFreeText("how the problem has changed over time", 8),
      severity_0_10: z
        .coerce
        .number({
          message: "Enter a severity from 0 to 10.",
        })
        .int("Severity must be a whole number.")
        .min(0, "Severity must be between 0 and 10.")
        .max(10, "Severity must be between 0 and 10."),
      aggravating_factors: requiredFreeText("what makes the problem worse"),
      relieving_factors: requiredFreeText("what makes the problem better"),
      prior_evaluation_treatment: requiredFreeText(
        "prior evaluation or treatment already tried",
      ),
    }),
    review_of_systems: z.object({
      constitutional: requiredFreeText("constitutional symptoms"),
      cardiovascular: requiredFreeText("cardiovascular symptoms"),
      respiratory: requiredFreeText("respiratory symptoms"),
      gastrointestinal: requiredFreeText("gastrointestinal symptoms"),
      neurological: requiredFreeText("neurological symptoms"),
      musculoskeletal: requiredFreeText("musculoskeletal symptoms"),
      other: requiredFreeText("other relevant symptoms"),
    }),
    past_medical_history: z.object({
      medical_conditions: requiredFreeText("past medical conditions"),
      surgeries_hospitalizations: requiredFreeText(
        "surgeries or hospitalizations",
      ),
      family_history: requiredFreeText("relevant family history"),
      allergies: requiredFreeText("allergies"),
    }),
    medications: z.object({
      prescriptions: requiredFreeText("current prescription medications"),
      otc_supplements: requiredFreeText("OTC medications or supplements"),
      adherence_issues: requiredFreeText("adherence issues or missed doses"),
    }),
    social_history: z.object({
      environment: z.object({
        housing: requiredFreeText("housing"),
        occupation: requiredFreeText("occupation"),
        sdoh: requiredFreeText("social determinants of health"),
        toxins_exposures: requiredFreeText("toxins or exposures"),
      }),
      body: z.object({
        diet: requiredFreeText("diet"),
        exercise: requiredFreeText("exercise"),
        substance_use: requiredFreeText("substance use"),
      }),
      mind: z.object({
        stress: requiredFreeText("stress"),
        social_support: requiredFreeText("social support"),
        relationships: requiredFreeText("relationships"),
      }),
    }),
  }),
  objective: z.object({
    demographics: z.object({
      age: requiredAge,
      sex_at_birth: requiredFreeText("sex at birth"),
      gender_identity: requiredFreeText("gender identity"),
    }),
    vitals: z.object({
      height: requiredFreeText("height"),
      weight: requiredFreeText("weight"),
      blood_pressure: requiredFreeText("blood pressure"),
      heart_rate: requiredFreeText("heart rate"),
    }),
    physical_exam: z.object({
      summary: requiredFreeText("physical exam findings"),
    }),
    labs_and_imaging: z.object({
      summary: requiredFreeText("labs and imaging"),
    }),
    risk_scores: z.object({
      summary: requiredFreeText("risk scores"),
    }),
  }),
});

// Assessment and Plan Schema
const planSchema = z.object({
  medications: expandableString,
  testing: expandableString,
  referrals: expandableString,
  lifestyle: expandableString,
  monitoring: expandableString,
  follow_up: expandableString,
  preventive_care: expandableString,
});

const assessmentSchema = z.object({
  id: z.string().uuid(),
  diagnosis: z.string(),
  icd_code: z.string(),
  status: z.string(),
  severity: z.string(),
  modifiers: expandableString,
  plan: planSchema,
});

// The complete patient case for the dashboard
export const dashboardCaseSchema = z.object({
  id: z.string().uuid(),
  patient: z.object({ first_name: z.string(), last_name: z.string(), email: z.string() }),
  submitted_at: z.string().datetime(),
  subjective: subjectiveNoteSchema,
  objective: objectiveNoteSchema,
  assessments: z.array(assessmentSchema),
});

// TypeScript Types
export type SubjectiveNote = z.infer<typeof subjectiveNoteSchema>;
export type ObjectiveNote = z.infer<typeof objectiveNoteSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type Plan = z.infer<typeof planSchema>;
export type DashboardCase = z.infer<typeof dashboardCaseSchema>;
export type PatientIntakeQuestionnaire = z.infer<
  typeof patientIntakeQuestionnaireSchema
>;
export type PatientIntakeQuestionnaireInput = z.input<
  typeof patientIntakeQuestionnaireSchema
>;
