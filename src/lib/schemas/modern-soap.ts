import { z } from "zod";

// Reusable schema for expandable items
const expandableString = z.object({
  summary: z.string(),
  details: z.string().optional(),
});

// Subjective Schema
const subjectiveSocialHistorySchema = z.object({
  environment: expandableString,
  body: expandableString,
  mind: expandableString,
});

export const subjectiveNoteSchema = z.object({
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
