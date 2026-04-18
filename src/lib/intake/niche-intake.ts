import {
  type ClinicDefinition,
  type QuestionnaireField,
} from "@/lib/clinics/niche-configs";
import { normalizeIntakeSubmission } from "@/lib/assessment/normalize-intake";
import { symptomCatalog, type IntakeFormInput } from "@/lib/schemas/intake";
import {
  formatAnswerValue,
  type NicheAnswerValue,
  type NicheIntakePayload,
} from "@/lib/schemas/niche-intake";

type PatientContext = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sexAtBirth: string;
  genderIdentity: string;
};

export type AnsweredQuestion = {
  key: string;
  question: string;
  value: NicheAnswerValue;
  formattedValue: string;
};

export type NicheSoapContext = {
  clinicLabel: string;
  clinicName: string;
  soapTemplate: ClinicDefinition["config"]["soap"];
  answeredQuestions: AnsweredQuestion[];
};

const symptomLexicon = new Map<string, string>([
  ["fatigue", "fatigue"],
  ["brain fog", "brain_fog"],
  ["sleep issues", "poor_sleep"],
  ["poor sleep", "poor_sleep"],
  ["sleep", "poor_sleep"],
  ["stress", "high_stress"],
  ["neck", "neck_pain"],
  ["lower back", "low_back_pain"],
  ["back", "low_back_pain"],
  ["head", "headaches"],
  ["headache", "headaches"],
  ["headaches", "headaches"],
  ["joint", "joint_pain"],
  ["shoulder", "joint_pain"],
  ["digestive issues", "bloating"],
  ["digestion", "bloating"],
  ["constipation", "constipation"],
  ["diarrhea", "diarrhea"],
  ["gas", "gas"],
  ["weight gain", "weight_gain"],
  ["sugar cravings", "sugar_cravings"],
  ["weakness", "numbness_weakness"],
  ["numbness", "numbness_weakness"],
]);

const symptomLabels = new Map<string, string>(
  symptomCatalog.map((symptom) => [symptom.key, symptom.label]),
);

function sentenceCase(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function containsKeyword(field: QuestionnaireField, keywords: string[]) {
  const haystack = `${field.key} ${field.question}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function scoreScaleLabel(question: string, value: number) {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes("stress")) {
    if (value >= 8) return `${value}/10 (high stress burden)`;
    if (value >= 5) return `${value}/10 (moderate stress burden)`;
    return `${value}/10 (lower reported stress burden)`;
  }

  if (normalizedQuestion.includes("sleep")) {
    if (value <= 3) return `${value}/10 (poor sleep quality)`;
    if (value <= 6) return `${value}/10 (inconsistent sleep quality)`;
    return `${value}/10 (better reported sleep quality)`;
  }

  if (normalizedQuestion.includes("energy")) {
    if (value <= 3) return `${value}/10 (marked low energy)`;
    if (value <= 6) return `${value}/10 (variable energy)`;
    return `${value}/10 (better reported energy)`;
  }

  if (normalizedQuestion.includes("pain")) {
    if (value >= 8) return `${value}/10 (high pain severity)`;
    if (value >= 5) return `${value}/10 (moderate pain severity)`;
    return `${value}/10 (lower pain severity)`;
  }

  return `${value}/10`;
}

function getAnswerText(value: NicheAnswerValue | undefined) {
  if (value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "number") {
    return String(value);
  }

  return value.trim();
}

function getQuestionText(
  questionnaire: QuestionnaireField[],
  answers: Record<string, NicheAnswerValue>,
  keys: string[],
) {
  return keys
    .map((key) => questionnaire.find((question) => question.key === key))
    .map((question) => (question ? getAnswerText(answers[question.key]) : ""))
    .find((value) => value.length > 0);
}

function joinQuestionAnswers(
  questionnaire: QuestionnaireField[],
  answers: Record<string, NicheAnswerValue>,
  keys: string[],
) {
  return keys
    .map((key) => questionnaire.find((question) => question.key === key))
    .map((question) => {
      if (!question) {
        return "";
      }

      const answer = getAnswerText(answers[question.key]);
      return answer ? `${sentenceCase(question.question)}: ${answer}` : "";
    })
    .filter(Boolean)
    .join("\n");
}

function inferSymptomKeys(answeredQuestions: AnsweredQuestion[]) {
  const keys = new Set<string>();

  answeredQuestions.forEach((question) => {
    const normalizedValue = question.formattedValue.toLowerCase();

    for (const [phrase, key] of symptomLexicon) {
      if (normalizedValue.includes(phrase)) {
        keys.add(key);
      }
    }

    if (question.key.includes("stress") && typeof question.value === "number" && question.value >= 7) {
      keys.add("high_stress");
    }

    if (
      (question.key.includes("sleep") &&
        typeof question.value === "number" &&
        question.value <= 4) ||
      normalizedValue.includes("poor sleep")
    ) {
      keys.add("poor_sleep");
    }

    if (
      question.key.includes("energy") &&
      typeof question.value === "number" &&
      question.value <= 4
    ) {
      keys.add("fatigue");
    }
  });

  return Array.from(keys);
}

function inferCustomSymptoms(
  answeredQuestions: AnsweredQuestion[],
  matchedSymptomKeys: string[],
) {
  const matchedLabels = new Set(
    matchedSymptomKeys.map((key) => symptomLabels.get(key)?.toLowerCase() ?? key),
  );

  return answeredQuestions
    .filter((question) =>
      containsKeyword(
        { key: question.key, question: question.question, type: "text" },
        ["symptom", "pain", "concern", "issue", "complaint", "imbalance"],
      ),
    )
    .map((question) => question.formattedValue)
    .flatMap((value) =>
      value
        .split(/[\n,]/)
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .filter((value) => !matchedLabels.has(value.toLowerCase()))
    .join("\n");
}

function buildAnsweredQuestions(clinic: ClinicDefinition, payload: NicheIntakePayload) {
  return clinic.config.questionnaire.map((question) => {
    const rawValue = payload.answers[question.key];
    const formattedValue =
      typeof rawValue === "number"
        ? scoreScaleLabel(question.question, rawValue)
        : formatAnswerValue(rawValue);

    return {
      key: question.key,
      question: question.question,
      value: rawValue,
      formattedValue,
    };
  });
}

function pickAssessmentNotes(
  clinic: ClinicDefinition,
  answeredQuestions: AnsweredQuestion[],
) {
  const duration = answeredQuestions.find((question) => question.key === "duration");
  const goals = answeredQuestions.find((question) => question.key === "goals");
  const stress = answeredQuestions.find((question) => question.key.includes("stress"));
  const sleep = answeredQuestions.find((question) => question.key.includes("sleep"));

  return {
    duration: duration?.formattedValue ?? "",
    goals: goals?.formattedValue ?? "",
    stress: stress?.formattedValue ?? "",
    sleep: sleep?.formattedValue ?? "",
    clinicLabel: clinic.config.label,
  };
}

export function transformNicheSubmission(args: {
  clinic: ClinicDefinition;
  payload: NicheIntakePayload;
  patient: PatientContext;
}) {
  const { clinic, payload, patient } = args;
  const answeredQuestions = buildAnsweredQuestions(clinic, payload);
  const severityAnswer = clinic.config.questionnaire.find((question) =>
    containsKeyword(question, ["severity", "pain level", "energy", "stress", "sleep"]),
  );
  const severityRaw = severityAnswer ? payload.answers[severityAnswer.key] : undefined;
  const symptomKeys = inferSymptomKeys(answeredQuestions);
  const customSymptoms = inferCustomSymptoms(answeredQuestions, symptomKeys);

  const primaryIssue =
    getQuestionText(clinic.config.questionnaire, payload.answers, [
      "chief_complaint",
      "chief_issue",
      "concern",
      "pain_location",
      "symptoms",
    ]) ||
    answeredQuestions[0]?.formattedValue ||
    "Patient concern not specified";

  const transformedInput: IntakeFormInput = {
    patient_info: {
      first_name: patient.firstName,
      last_name: patient.lastName,
      age: null,
      sex_at_birth: patient.sexAtBirth,
      gender_identity: patient.genderIdentity,
      phone: patient.phone,
      email: patient.email,
    },
    chief_complaint: {
      primary_issue: primaryIssue,
      duration:
        getQuestionText(clinic.config.questionnaire, payload.answers, [
          "duration",
          "timeline",
        ]) ?? "Not specified",
      severity_0_10:
        typeof severityRaw === "number"
          ? Math.max(0, Math.min(10, severityRaw))
          : 5,
      onset:
        getQuestionText(clinic.config.questionnaire, payload.answers, [
          "trigger",
          "duration",
        ]) ?? "",
      aggravating_factors:
        getQuestionText(clinic.config.questionnaire, payload.answers, [
          "trigger",
          "work_style",
        ]) ?? "",
      relieving_factors:
        getQuestionText(clinic.config.questionnaire, payload.answers, [
          "goals",
        ]) ?? "",
    },
    symptom_keys: symptomKeys,
    custom_symptoms: customSymptoms,
    history: {
      conditions: joinQuestionAnswers(clinic.config.questionnaire, payload.answers, [
        "medical_history",
        "history",
        "injury_history",
        "allergies",
        "treatment_history",
      ]),
      medications: joinQuestionAnswers(clinic.config.questionnaire, payload.answers, [
        "medications",
      ]),
      surgeries: joinQuestionAnswers(clinic.config.questionnaire, payload.answers, [
        "treatment_history",
      ]),
      family_history: "",
    },
    lifestyle: {
      diet:
        getQuestionText(clinic.config.questionnaire, payload.answers, [
          "diet",
          "lifestyle",
        ]) ?? "Not collected",
      exercise:
        getQuestionText(clinic.config.questionnaire, payload.answers, [
          "work_style",
        ]) ?? "Not collected",
      sleep:
        getQuestionText(clinic.config.questionnaire, payload.answers, [
          "sleep",
        ]) ?? "Not collected",
      stress:
        getQuestionText(clinic.config.questionnaire, payload.answers, [
          "stress",
        ]) ?? "Not collected",
      substance_use: "Not collected",
    },
    goals: {
      patient_priorities: joinQuestionAnswers(clinic.config.questionnaire, payload.answers, [
        "goals",
        "timeline",
      ]),
      expectations:
        getQuestionText(clinic.config.questionnaire, payload.answers, [
          "goals",
          "timeline",
        ]) ?? "",
    },
    metadata: {
      source: `web-niche-config:${clinic.niche}`,
    },
  };

  return {
    normalizedIntake: normalizeIntakeSubmission(transformedInput),
    soapContext: {
      clinicLabel: clinic.config.label,
      clinicName: clinic.clinicName,
      soapTemplate: clinic.config.soap,
      answeredQuestions,
    } satisfies NicheSoapContext,
    assessmentNotes: pickAssessmentNotes(clinic, answeredQuestions),
  };
}

function expandTokens(tokens: string[]) {
  const synonymMap: Record<string, string[]> = {
    complaint: ["concern", "issue", "pain", "symptom"],
    history: ["medical", "injury", "treatment", "medications"],
    lifestyle: ["diet", "sleep", "stress", "routine", "work"],
    timeline: ["duration", "when", "timeline", "onset"],
    mobility: ["movement", "mobility", "restrictions"],
    visible: ["skin", "appearance", "concern"],
    expectations: ["goals", "timeline", "outcome"],
    emotional: ["stress", "energy"],
    vitals: ["pain", "sleep", "stress", "energy"],
    patterns: ["symptoms", "concern", "issue", "pain"],
  };

  return Array.from(
    new Set(tokens.flatMap((token) => [token, ...(synonymMap[token] ?? [])])),
  );
}

function pickEntriesForSoapBullet(
  bullet: string,
  answeredQuestions: AnsweredQuestion[],
  fallbackCount = 2,
) {
  const bulletTokens = expandTokens(tokenize(bullet));
  const scored = answeredQuestions
    .map((question) => {
      const questionTokens = tokenize(`${question.key} ${question.question}`);
      const score = bulletTokens.filter((token) =>
        questionTokens.includes(token),
      ).length;

      return { question, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (scored.length > 0) {
    return scored.slice(0, fallbackCount).map((item) => item.question);
  }

  return answeredQuestions.slice(0, fallbackCount);
}

export function buildSoapSectionLine(
  bullet: string,
  answeredQuestions: AnsweredQuestion[],
) {
  const matches = pickEntriesForSoapBullet(bullet, answeredQuestions);
  const values = matches.map((match) => match.formattedValue).filter(Boolean);

  if (values.length === 0) {
    return `${bullet}: Not explicitly collected in this intake.`;
  }

  return `${bullet}: ${values.join("; ")}.`;
}
