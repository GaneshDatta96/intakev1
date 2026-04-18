import {
  soapDraftSchema,
  type AssessmentResult,
  type SoapDraft,
} from "@/lib/schemas/soap";
import { type ClinicDefinition } from "@/lib/clinics/niche-configs";
import {
  buildSoapSectionLine,
  type NicheSoapContext,
} from "@/lib/intake/niche-intake";
import { type NormalizedIntake } from "@/lib/schemas/intake";

const PROMPT_VERSION = "soap_v2_niche_config";

const SYSTEM_PROMPT = `You are a clinical documentation assistant for a US outpatient wellness clinic.
Generate a SOAP note from structured intake and structured assessment results.

Rules:
- Do not provide a definitive diagnosis.
- Do not prescribe medications, supplements, or treatment regimens.
- Use strong but non-diagnostic clinical language.
- Follow the clinic's SOAP template to decide what belongs in S, O, and A.
- Examples:
  - "Findings are consistent with..."
  - "Pattern suggests..."
  - "Presentation may reflect..."
- The Objective section must be limited to facts explicitly present in the intake or assessment inputs.
- If no exam, labs, or vitals are provided, say so clearly.
- The Plan section must stay brief, clearly provisional, and easy for the clinician to edit manually.

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
  clinic?: ClinicDefinition,
  soapContext?: NicheSoapContext,
): SoapDraft {
  if (clinic && soapContext) {
    return buildConfiguredFallbackSoap(intake, assessmentResults, clinic, soapContext);
  }

  return buildDefaultFallbackSoap(intake, assessmentResults);
}

function buildConfiguredFallbackSoap(
  intake: NormalizedIntake,
  assessmentResults: AssessmentResult[],
  clinic: ClinicDefinition,
  soapContext: NicheSoapContext,
) {
  const topPattern = assessmentResults[0];
  const subjective = clinic.config.soap.S
    .map((bullet) => buildSoapSectionLine(bullet, soapContext.answeredQuestions))
    .join(" ");

  const objective = clinic.config.soap.O
    .map((bullet) => buildObjectiveLine(bullet, intake, soapContext))
    .join(" ");

  const assessment = clinic.config.soap.A
    .map((bullet) => buildAssessmentLine(bullet, intake, assessmentResults, soapContext))
    .join(" ");

  const planLines =
    clinic.config.soap.P.length > 0
      ? clinic.config.soap.P.map(
          (item) => `- ${item}: clinician to complete after review.`,
        )
      : [
          "- Plan intentionally left manual for clinician review.",
          "- Confirm history, exam findings, and final treatment decisions during the visit.",
        ];

  return soapDraftSchema.parse({
    subjective:
      subjective ||
      `Submitted ${clinic.config.label.toLowerCase()} intake centers on ${intake.chief_complaint.primary_issue.toLowerCase()}.`,
    objective:
      objective ||
      "Objective is limited to patient-reported intake information gathered before the visit.",
    assessment:
      assessment ||
      (topPattern
        ? `Leading working impression suggests ${topPattern.label.toLowerCase()} with clinician correlation still required.`
        : "Initial assessment remains broad and should be refined during clinician review."),
    plan_draft: ["Manual Plan", ...planLines].join("\n"),
  });
}

function buildObjectiveLine(
  bullet: string,
  intake: NormalizedIntake,
  soapContext: NicheSoapContext,
) {
  const normalizedBullet = bullet.toLowerCase();

  if (normalizedBullet.includes("vital")) {
    return `Reported vitals or measurable self-reported values include symptom severity ${intake.chief_complaint.severity_0_10}/10, sleep "${intake.lifestyle.sleep}", and stress "${intake.lifestyle.stress}".`;
  }

  if (normalizedBullet.includes("skin")) {
    return buildSoapSectionLine(bullet, soapContext.answeredQuestions);
  }

  if (normalizedBullet.includes("mobility")) {
    return buildSoapSectionLine(bullet, soapContext.answeredQuestions);
  }

  if (normalizedBullet.includes("behavior") || normalizedBullet.includes("pattern")) {
    return `Observed from intake structure: ${intake.symptoms.length} symptom cluster(s) and ${intake.goals.patient_priorities.length} stated priority item(s) were reported by the patient.`;
  }

  if (normalizedBullet.includes("visible")) {
    return buildSoapSectionLine(bullet, soapContext.answeredQuestions);
  }

  return buildSoapSectionLine(bullet, soapContext.answeredQuestions);
}

function buildAssessmentLine(
  bullet: string,
  intake: NormalizedIntake,
  assessmentResults: AssessmentResult[],
  soapContext: NicheSoapContext,
) {
  const normalizedBullet = bullet.toLowerCase();
  const topPattern = assessmentResults[0];

  if (normalizedBullet.includes("risk")) {
    return intake.red_flags.length > 0
      ? `Risk flags: reported red flag items include ${joinSentence(intake.red_flags.map((flag) => flag.replaceAll("_", " ")))} and should be reviewed promptly.`
      : "Risk flags: no urgent red flag terms were identified from the submitted intake.";
  }

  if (normalizedBullet.includes("severity")) {
    return `Severity classification: patient-reported severity is ${intake.chief_complaint.severity_0_10}/10 with current workflow priority considered ${topPattern?.risk_level.replaceAll("_", " ") ?? "routine"}.`;
  }

  if (normalizedBullet.includes("chronic") || normalizedBullet.includes("acute")) {
    return `Chronicity assessment: reported duration is ${intake.chief_complaint.duration.toLowerCase()}, which should be interpreted in the context of onset and functional impact.`;
  }

  if (normalizedBullet.includes("pattern")) {
    return topPattern
      ? `${sentenceCase(bullet)}: leading intake pattern suggests ${topPattern.label.toLowerCase()} with confidence ${topPattern.confidence.toFixed(2)}.`
      : `${sentenceCase(bullet)}: intake remains nonspecific and needs clinician correlation.`;
  }

  if (normalizedBullet.includes("lifestyle")) {
    return `Lifestyle contributors: diet is documented as "${intake.lifestyle.diet}", sleep as "${intake.lifestyle.sleep}", and stress as "${intake.lifestyle.stress}".`;
  }

  if (normalizedBullet.includes("expectation")) {
    return intake.goals.expectations
      ? `Expectation alignment: patient-stated goals and timing preferences center on ${intake.goals.expectations.toLowerCase()}.`
      : "Expectation alignment: patient expectations should be clarified during clinical review.";
  }

  if (normalizedBullet.includes("suitability")) {
    return "Suitability for aesthetic procedures should be confirmed after clinician review of goals, history, and contraindication screening.";
  }

  if (normalizedBullet.includes("stress-digestion")) {
    return `Stress-digestion link: stress is reported as "${intake.lifestyle.stress}" and digestive context should be interpreted alongside the submitted symptom profile.`;
  }

  return buildSoapSectionLine(bullet, soapContext.answeredQuestions);
}

function buildDefaultFallbackSoap(
  intake: NormalizedIntake,
  assessmentResults: AssessmentResult[],
) {
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

  const objective = [
    "Objective is limited to intake-derived information only.",
    `Reported symptom severity is ${intake.chief_complaint.severity_0_10}/10.`,
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

function sentenceCase(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
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
  clinic?: ClinicDefinition;
  soapContext?: NicheSoapContext;
}) {
  const { intake, assessmentResults, clinic, soapContext } = args;
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

  if (!apiKey) {
    return {
      promptVersion: PROMPT_VERSION,
      model: "fallback/local-template",
      usedFallback: true,
      soap: buildFallbackSoap(intake, assessmentResults, clinic, soapContext),
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
            )}\n\nCLINIC_CONFIG:\n${JSON.stringify(
              clinic
                ? {
                    slug: clinic.slug,
                    niche: clinic.niche,
                    label: clinic.config.label,
                    soap: clinic.config.soap,
                  }
                : null,
              null,
              2,
            )}\n\nSOAP_CONTEXT:\n${JSON.stringify(
              soapContext ?? null,
              null,
              2,
            )}\n\nTASK:\nWrite Subjective, Objective, Assessment, and a minimal editable plan draft. Use the clinic SOAP config as the section coverage guide. Keep Plan obviously provisional for clinician editing.`,
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
      soap: buildFallbackSoap(intake, assessmentResults, clinic, soapContext),
    };
  }
}
