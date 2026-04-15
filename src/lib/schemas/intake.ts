import { z } from "zod";

export const symptomCatalog = [
  { key: "bloating", label: "Bloating" },
  { key: "gas", label: "Gas" },
  { key: "constipation", label: "Constipation" },
  { key: "diarrhea", label: "Diarrhea" },
  { key: "fatigue", label: "Fatigue" },
  { key: "brain_fog", label: "Brain fog" },
  { key: "poor_sleep", label: "Poor sleep" },
  { key: "high_stress", label: "High stress" },
  { key: "low_back_pain", label: "Low back pain" },
  { key: "neck_pain", label: "Neck pain" },
  { key: "joint_pain", label: "Joint pain" },
  { key: "headaches", label: "Headaches" },
  { key: "weight_gain", label: "Weight gain" },
  { key: "sugar_cravings", label: "Sugar cravings" },
  { key: "blood_in_stool", label: "Blood in stool" },
  { key: "unintentional_weight_loss", label: "Unintentional weight loss" },
  { key: "numbness_weakness", label: "Numbness or weakness" },
] as const;

const emailSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    message: "Enter a valid email address or leave it blank.",
  });

export const intakeFormSchema = z.object({
  patient_info: z.object({
    first_name: z.string().trim().min(1, "First name is required."),
    last_name: z.string().trim().min(1, "Last name is required."),
    age: z.number().int().min(0).max(120),
    sex_at_birth: z.string().trim().min(1, "Sex at birth is required."),
    gender_identity: z.string().trim().default(""),
    phone: z.string().trim().default(""),
    email: emailSchema.default(""),
  }),
  chief_complaint: z.object({
    primary_issue: z.string().trim().min(1, "Primary issue is required."),
    duration: z.string().trim().min(1, "Duration is required."),
    severity_0_10: z.number().int().min(0).max(10),
    onset: z.string().trim().default(""),
    aggravating_factors: z.string().trim().default(""),
    relieving_factors: z.string().trim().default(""),
  }),
  symptom_keys: z.array(z.string()).default([]),
  custom_symptoms: z.string().trim().default(""),
  history: z.object({
    conditions: z.string().trim().default(""),
    medications: z.string().trim().default(""),
    surgeries: z.string().trim().default(""),
    family_history: z.string().trim().default(""),
  }),
  lifestyle: z.object({
    diet: z.string().trim().default(""),
    exercise: z.string().trim().default(""),
    sleep: z.string().trim().default(""),
    stress: z.string().trim().default(""),
    substance_use: z.string().trim().default(""),
  }),
  goals: z.object({
    patient_priorities: z.string().trim().default(""),
    expectations: z.string().trim().default(""),
  }),
  metadata: z
    .object({
      source: z.string().trim().default("web"),
    })
    .default({ source: "web" }),
});

export const normalizedSymptomSchema = z.object({
  key: z.string(),
  label: z.string(),
  severity_0_10: z.number().min(0).max(10),
  frequency: z.string(),
  duration: z.string(),
  custom_text: z.string(),
});

export const normalizedIntakeSchema = z.object({
  schema_version: z.literal("1.0.0"),
  patient_info: z.object({
    first_name: z.string(),
    last_name: z.string(),
    age: z.number().int(),
    sex_at_birth: z.string(),
    gender_identity: z.string(),
    contact: z.object({
      phone: z.string(),
      email: z.string(),
    }),
  }),
  chief_complaint: z.object({
    primary_issue: z.string(),
    duration: z.string(),
    severity_0_10: z.number().min(0).max(10),
    onset: z.string(),
    aggravating_factors: z.array(z.string()),
    relieving_factors: z.array(z.string()),
  }),
  symptoms: z.array(normalizedSymptomSchema),
  history: z.object({
    conditions: z.array(z.string()),
    medications: z.array(z.string()),
    surgeries: z.array(z.string()),
    family_history: z.array(z.string()),
  }),
  lifestyle: z.object({
    diet: z.string(),
    exercise: z.string(),
    sleep: z.string(),
    stress: z.string(),
    substance_use: z.string(),
  }),
  goals: z.object({
    patient_priorities: z.array(z.string()),
    expectations: z.string(),
  }),
  red_flags: z.array(z.string()),
  metadata: z.object({
    source: z.string(),
    submitted_at: z.string(),
  }),
});

export type IntakeFormInput = z.infer<typeof intakeFormSchema>;
export type IntakeFormValues = z.input<typeof intakeFormSchema>;
export type NormalizedIntake = z.infer<typeof normalizedIntakeSchema>;
