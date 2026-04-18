import { z } from "zod";
import { type NicheConfig, type QuestionnaireField } from "@/lib/clinics/niche-configs";

const baseAnswerSchema = z.union([
  z.string(),
  z.number(),
  z.array(z.string()),
]);

export const nicheIntakeBaseSchema = z.object({
  patient_id: z.string().uuid(),
  clinic_slug: z.string().trim().min(1),
  niche: z.string().trim().min(1),
  answers: z.record(z.string(), baseAnswerSchema),
});

export type NicheAnswerValue = z.infer<typeof baseAnswerSchema>;
export type NicheIntakePayload = z.infer<typeof nicheIntakeBaseSchema>;

function buildQuestionAnswerSchema(question: QuestionnaireField) {
  switch (question.type) {
    case "text":
      return z
        .string()
        .trim()
        .min(
          1,
          `Enter a response for "${question.question}". If it does not apply, write "None" or "Not applicable".`,
        );
    case "select":
      return z
        .string()
        .trim()
        .refine((value) => question.options.includes(value), {
          message: `Choose one option for "${question.question}".`,
        });
    case "multi":
      return z
        .array(z.string().trim())
        .min(1, `Select at least one option for "${question.question}".`)
        .refine(
          (values) => values.every((value) => question.options.includes(value)),
          {
            message: `Choose valid options for "${question.question}".`,
          },
        );
    case "scale":
      return z
        .coerce
        .number({
          message: `Enter a value for "${question.question}".`,
        })
        .int(`"${question.question}" must be a whole number.`)
        .min(
          question.min,
          `"${question.question}" must be at least ${question.min}.`,
        )
        .max(
          question.max,
          `"${question.question}" must be at most ${question.max}.`,
        );
  }
}

export function buildQuestionnaireAnswersSchema(config: NicheConfig) {
  const shape = Object.fromEntries(
    config.questionnaire.map((question) => [
      question.key,
      buildQuestionAnswerSchema(question),
    ]),
  );

  return z.object(shape);
}

export function buildNicheIntakeSubmissionSchema(config: NicheConfig) {
  return nicheIntakeBaseSchema.extend({
    answers: buildQuestionnaireAnswersSchema(config),
  });
}

export function getDefaultAnswerValue(question: QuestionnaireField) {
  switch (question.type) {
    case "multi":
      return [] as string[];
    case "scale":
      return question.min;
    default:
      return "";
  }
}

export function formatAnswerValue(value: NicheAnswerValue) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "number") {
    return String(value);
  }

  return value;
}
