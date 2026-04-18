import { patternLibrary } from "@/lib/assessment/pattern-library";
import { normalizedIntakeSchema, type NormalizedIntake } from "@/lib/schemas/intake";
import {
  assessmentResultSchema,
  type AssessmentResult,
} from "@/lib/schemas/soap";

function normalizeText(value: string) {
  return value.toLowerCase();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function deriveContextSignals(intake: NormalizedIntake) {
  const signals = new Set<string>();
  const diet = normalizeText(intake.lifestyle.diet);
  const exercise = normalizeText(intake.lifestyle.exercise);
  const sleep = normalizeText(intake.lifestyle.sleep);
  const stress = normalizeText(intake.lifestyle.stress);
  const complaint = normalizeText(intake.chief_complaint.primary_issue);
  const history = intake.history.conditions.map(normalizeText).join(" ");
  const medications = intake.history.medications.map(normalizeText).join(" ");
  const familyHistory = intake.history.family_history.map(normalizeText).join(" ");

  if (hasAny(diet, ["processed", "fast food", "takeout", "sugar"])) {
    signals.add("processed_diet");
  }
  if (hasAny(diet, ["sugar", "sweet", "dessert"])) {
    signals.add("sugar_heavy_diet");
  }
  if (hasAny(exercise, ["none", "sedentary", "minimal", "rare"])) {
    signals.add("sedentary");
  }
  if (hasAny(sleep, ["poor", "insomnia", "waking", "broken", "restless"])) {
    signals.add("poor_sleep");
  }
  if (hasAny(stress, ["high", "elevated", "overwhelmed", "anxious"])) {
    signals.add("high_stress");
  }
  if (hasAny(medications, ["antibiotic", "amoxicillin", "azithromycin"])) {
    signals.add("recent_antibiotics");
  }
  if (hasAny(history, ["arthritis", "autoimmune", "inflammation", "psoriasis"])) {
    signals.add("inflammatory_history");
  }
  if (hasAny(familyHistory, ["diabetes", "prediabetes", "thyroid", "metabolic"])) {
    signals.add("family_metabolic_history");
  }
  if (hasAny(complaint, ["lifting", "sitting", "desk", "posture", "movement"])) {
    signals.add("mechanical_trigger");
  }

  return signals;
}

function buildEvidence(
  intake: NormalizedIntake,
  matchedSymptoms: string[],
  matchedContexts: string[],
) {
  const evidence = new Set<string>();

  if (intake.chief_complaint.primary_issue) {
    evidence.add(
      `Primary concern reported as "${intake.chief_complaint.primary_issue}" for ${intake.chief_complaint.duration}.`,
    );
  }

  if (intake.chief_complaint.severity_0_10 >= 7) {
    evidence.add(
      `Reported symptom severity is ${intake.chief_complaint.severity_0_10}/10.`,
    );
  }

  intake.symptoms.forEach((symptom) => {
    if (matchedSymptoms.includes(symptom.key)) {
      evidence.add(
        `Patient reports ${symptom.label.toLowerCase()} with duration noted as ${symptom.duration}.`,
      );
    }
  });

  matchedContexts.forEach((signal) => {
    const labels: Record<string, string> = {
      processed_diet: "Diet history suggests a processed or sugar-heavy intake pattern.",
      sugar_heavy_diet: "Diet history mentions frequent sugar intake or cravings.",
      sedentary: "Exercise history suggests limited activity or sedentary behavior.",
      poor_sleep: "Sleep history describes poor sleep quality or disruption.",
      high_stress: "Lifestyle history notes elevated stress burden.",
      recent_antibiotics: "Medication history suggests recent antibiotic exposure.",
      inflammatory_history: "Past history suggests inflammatory contributors.",
      family_metabolic_history: "Family history suggests metabolic risk factors.",
      mechanical_trigger: "Chief complaint appears linked to position or movement triggers.",
    };

    if (labels[signal]) {
      evidence.add(labels[signal]);
    }
  });

  return Array.from(evidence).slice(0, 5);
}

export function scorePatterns(input: NormalizedIntake): AssessmentResult[] {
  const intake = normalizedIntakeSchema.parse(input);
  const symptomKeys = new Set(intake.symptoms.map((symptom) => symptom.key));
  const contextSignals = deriveContextSignals(intake);
  const completenessFields = [
    intake.chief_complaint.onset,
    intake.lifestyle.diet,
    intake.lifestyle.exercise,
    intake.lifestyle.sleep,
    intake.lifestyle.stress,
    intake.goals.expectations,
  ];

  const completenessRatio =
    completenessFields.filter((value) => value.trim().length > 0).length /
    completenessFields.length;

  const scored = patternLibrary
    .map((pattern) => {
      const requiredMatches = pattern.requiredSymptoms.filter((item) =>
        symptomKeys.has(item),
      );
      const supportingMatches = pattern.supportingSymptoms.filter((item) =>
        symptomKeys.has(item),
      );
      const matchedContexts = pattern.contextSignals.filter((signal) =>
        contextSignals.has(signal),
      );
      const matchedRedFlags = pattern.redFlags.filter((flag) =>
        intake.red_flags.includes(flag),
      );

      const requiredScore =
        pattern.requiredSymptoms.length > 0
          ? 0.45 * (requiredMatches.length / pattern.requiredSymptoms.length)
          : 0;
      const supportingScore =
        pattern.supportingSymptoms.length > 0
          ? 0.25 *
            Math.min(
              1,
              supportingMatches.length /
                Math.max(pattern.supportingSymptoms.length, 1),
            )
          : 0;
      const contextScore =
        pattern.contextSignals.length > 0
          ? 0.2 *
            Math.min(
              1,
              matchedContexts.length / Math.max(pattern.contextSignals.length, 1),
            )
          : 0;
      const completenessScore = 0.1 * completenessRatio;
      const penalty =
        matchedRedFlags.length > 0
          ? 0.05
          : requiredMatches.length === 0 && pattern.requiredSymptoms.length > 0
            ? 0.12
            : 0;

      const confidence = Math.max(
        0,
        Math.min(
          1,
          requiredScore +
            supportingScore +
            contextScore +
            completenessScore -
            penalty,
        ),
      );

      const risk_level =
        matchedRedFlags.length > 0
          ? "urgent_review"
          : intake.chief_complaint.severity_0_10 >= 8 ||
              (intake.patient_info.age !== null && intake.patient_info.age >= 65)
            ? "priority"
            : "routine";

      return {
        pattern_key: pattern.key,
        label: pattern.label,
        confidence: Number(confidence.toFixed(2)),
        risk_level,
        evidence: buildEvidence(
          intake,
          [...requiredMatches, ...supportingMatches],
          matchedContexts,
        ),
        data_gaps: pattern.dataGapPrompts.slice(0, 3),
        matched_context: matchedContexts,
      };
    })
    .filter((pattern) => pattern.confidence >= 0.25)
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 3)
    .map((pattern, index) =>
      assessmentResultSchema.parse({
        ...pattern,
        rank: index + 1,
      }),
    );

  if (scored.length > 0) {
    return scored;
  }

  return [
    assessmentResultSchema.parse({
      pattern_key: "nonspecific_pattern",
      label: "Nonspecific Clinical Pattern",
      confidence: 0.32,
      risk_level:
        intake.red_flags.length > 0
          ? "urgent_review"
          : intake.chief_complaint.severity_0_10 >= 8
            ? "priority"
            : "routine",
      evidence: [
        `Primary concern reported as "${intake.chief_complaint.primary_issue}".`,
        `Submitted intake includes ${intake.symptoms.length} reported symptoms.`,
      ],
      data_gaps: ["problem chronology", "prior workup", "functional impact"],
      matched_context: [],
      rank: 1,
    }),
  ];
}
