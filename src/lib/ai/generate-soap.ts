import {
  soapDraftSchema,
  type AssessmentResult,
  type SoapDraft,
} from "@/lib/schemas/soap";
import { type NormalizedIntake } from "@/lib/schemas/intake";
import { type PatientIntakeQuestionnaire } from "@/lib/schemas/modern-soap";

const PROMPT_VERSION = "soap_v1";

const SYSTEM_PROMPT = `You are a clinical documentation assistant for a US outpatient wellness clinic.
Generate a SOAP note from structured intake and structured assessment results.

Rules:
- Do not provide a definitive diagnosis.
- Do not prescribe medications, supplements, or treatment regimens.
- Use strong but non-diagnostic clinical language.
- Examples:
  - "Findings are consistent with..."
  - "Pattern suggests..."
  - "Presentation may reflect..."
- The Objective section must be limited to facts explicitly present in the intake or assessment inputs.
- If no exam, labs, or vitals are provided, say so clearly.
- The Plan section must be brief and editable by the clinician, not a finalized treatment plan.

Return JSON with:
{
  "subjective": "",
  "objective": "",
  "assessment": "",
  "plan_draft": ""
}`;

function joinSentence(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

export function buildFallbackSoap(
  intake: NormalizedIntake,
  assessmentResults: AssessmentResult[],
  questionnaire?: PatientIntakeQuestionnaire,
): SoapDraft {
  const symptomLabels = intake.symptoms
    .slice(0, 5)
    .map((item) => item.label.toLowerCase());
  const topPattern = assessmentResults[0];

  const subjective = [
    `Patient reports ${intake.chief_complaint.primary_issue.toLowerCase()} present for ${intake.chief_complaint.duration}.`,
    symptomLabels.length > 0
      ? `Associated symptoms include ${joinSentence(symptomLabels)}.`
      : "Associated symptoms were reported in the intake but remain incompletely characterized.",
    intake.chief_complaint.aggravating_factors.length > 0
      ? `Aggravating factors include ${joinSentence(intake.chief_complaint.aggravating_factors)}.`
      : "",
    intake.chief_complaint.relieving_factors.length > 0
      ? `Relieving factors include ${joinSentence(intake.chief_complaint.relieving_factors)}.`
      : "",
    intake.goals.expectations
      ? `Patient goals include ${intake.goals.expectations.toLowerCase()}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const objectiveFromQuestionnaire = questionnaire
    ? [
        `Patient-reported demographics include age ${questionnaire.objective.demographics.age}, sex at birth ${questionnaire.objective.demographics.sex_at_birth.toLowerCase()}, and gender identity ${questionnaire.objective.demographics.gender_identity.toLowerCase()}.`,
        `Patient-reported vitals include height ${questionnaire.objective.vitals.height}, weight ${questionnaire.objective.vitals.weight}, blood pressure ${questionnaire.objective.vitals.blood_pressure}, and heart rate ${questionnaire.objective.vitals.heart_rate}.`,
        `Patient-reported physical exam information: ${questionnaire.objective.physical_exam.summary}.`,
        `Patient-reported labs and imaging: ${questionnaire.objective.labs_and_imaging.summary}.`,
        `Patient-reported risk scores: ${questionnaire.objective.risk_scores.summary}.`,
      ]
    : [];

  const objective = [
    questionnaire
      ? "Objective includes patient-reported demographic and clinical data supplied through the intake."
      : "Objective is limited to intake-derived information only.",
    `Reported symptom severity is ${intake.chief_complaint.severity_0_10}/10.`,
    ...objectiveFromQuestionnaire,
    intake.red_flags.length > 0
      ? `Reported red flag items requiring clinician review include ${joinSentence(intake.red_flags.map((flag) => flag.replaceAll("_", " ")))}.`
      : "No additional red flag items were identified from the submitted intake.",
  ].join(" ");

  const assessmentLines = assessmentResults.map((item) => {
    const evidence = joinSentence(item.evidence.slice(0, 3));
    const gaps = joinSentence(item.data_gaps.slice(0, 3));

    return `${item.rank}. Findings are consistent with ${item.label.toLowerCase()}. Confidence ${item.confidence.toFixed(
      2,
    )}. Supporting evidence includes ${evidence}. Risk stratification: ${item.risk_level.replaceAll(
      "_",
      " ",
    )}. Data gaps include ${gaps}.`;
  });

  const assessment = [
    topPattern
      ? `Pattern suggests ${topPattern.label.toLowerCase()} as the leading non-diagnostic working impression.`
      : "Pattern suggests a nonspecific but clinically relevant symptom cluster requiring further review.",
    ...assessmentLines,
  ].join(" ");

  const plan_draft = [
    "Focus Areas:",
    "- Clarify chronology, triggers, and functional impact.",
    "Suggested Investigations:",
    "- Clinician to determine based on examination and history review.",
    "Monitoring:",
    "- Track symptom severity, frequency, and response to initial recommendations.",
    "Follow-up:",
    "- Review after practitioner assessment and any indicated workup.",
  ].join("\n");

  return soapDraftSchema.parse({
    subjective,
    objective,
    assessment,
    plan_draft,
  });
}

function extractJsonContent(content: unknown) {
  if (typeof content === "string") {
    return JSON.parse(content);
  }

  if (Array.isArray(content)) {
    const joinedText = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("");

    return JSON.parse(joinedText);
  }

  return content;
}

export async function generateSoapDraft(args: {
  intake: NormalizedIntake;
  assessmentResults: AssessmentResult[];
  questionnaire?: PatientIntakeQuestionnaire;
}) {
  const { intake, assessmentResults, questionnaire } = args;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

  if (!apiKey) {
    return {
      promptVersion: PROMPT_VERSION,
      model: "fallback/local-template",
      usedFallback: true,
      soap: buildFallbackSoap(intake, assessmentResults, questionnaire),
    };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Intake V1",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `INTAKE_JSON:\n${JSON.stringify(
              intake,
              null,
              2,
            )}\n\nASSESSMENT_RESULTS:\n${JSON.stringify(
              assessmentResults,
              null,
              2,
            )}\n\nQUESTIONNAIRE_JSON:\n${JSON.stringify(
              questionnaire ?? null,
              null,
              2,
            )}\n\nTASK:\nWrite Subjective, Objective, Assessment, and a minimal editable plan draft.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "soap_draft",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subjective: { type: "string" },
                objective: { type: "string" },
                assessment: { type: "string" },
                plan_draft: { type: "string" },
              },
              required: [
                "subjective",
                "objective",
                "assessment",
                "plan_draft",
              ],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed with ${response.status}`);
    }

    const payload = await response.json();
    const parsed = soapDraftSchema.parse(
      extractJsonContent(payload.choices?.[0]?.message?.content),
    );

    return {
      promptVersion: PROMPT_VERSION,
      model,
      usedFallback: false,
      soap: parsed,
      tokenUsage: payload.usage ?? null,
    };
  } catch {
    return {
      promptVersion: PROMPT_VERSION,
      model: "fallback/local-template",
      usedFallback: true,
      soap: buildFallbackSoap(intake, assessmentResults, questionnaire),
    };
  }
}
