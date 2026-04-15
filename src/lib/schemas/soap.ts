import { z } from "zod";

export const assessmentResultSchema = z.object({
  pattern_key: z.string(),
  label: z.string(),
  confidence: z.number().min(0).max(1),
  risk_level: z.enum(["routine", "priority", "urgent_review"]),
  evidence: z.array(z.string()),
  data_gaps: z.array(z.string()),
  matched_context: z.array(z.string()),
  rank: z.number().int().positive(),
});

export const soapDraftSchema = z.object({
  subjective: z.string().min(1),
  objective: z.string().min(1),
  assessment: z.string().min(1),
  plan_draft: z.string().min(1),
});

export type AssessmentResult = z.infer<typeof assessmentResultSchema>;
export type SoapDraft = z.infer<typeof soapDraftSchema>;
