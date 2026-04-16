import { generateSoapDraft } from "@/lib/ai/generate-soap";
import { normalizeIntakeSubmission } from "@/lib/assessment/normalize-intake";
import { scorePatterns } from "@/lib/assessment/score-patterns";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import {
  type AppointmentRequestInput,
  type IntakeFormInput,
  type NormalizedIntake,
} from "@/lib/schemas/intake";
import { type SubjectiveNote } from "@/lib/schemas/modern-soap";
import { type AssessmentResult, type SoapDraft } from "@/lib/schemas/soap";

export type ProcessedEncounter = {
  encounterId: string;
  patientId: string;
  persisted: boolean;
  normalizedIntake: NormalizedIntake;
  assessmentResults: AssessmentResult[];
  soap: SoapDraft;
  promptVersion: string;
  model: string;
  usedFallback: boolean;
  tokenUsage?: unknown;
};

type ResolvedPatientContext = {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sexAtBirth: string;
  genderIdentity: string;
  existsInDatabase: boolean;
};

function buildFallbackPatientContext(patientId: string): ResolvedPatientContext {
  return {
    patientId,
    firstName: "Demo",
    lastName: "Patient",
    email: "",
    phone: "",
    sexAtBirth: "Not specified",
    genderIdentity: "",
    existsInDatabase: false,
  };
}

async function resolvePatientContext(patientId: string) {
  const supabase = getSupabaseAdmin();
  const fallback = buildFallbackPatientContext(patientId);

  if (!supabase) {
    return {
      supabase,
      patient: fallback,
    };
  }

  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, email, phone, sex_at_birth, gender_identity",
    )
    .eq("id", patientId)
    .maybeSingle();

  if (error || !data) {
    return {
      supabase,
      patient: fallback,
    };
  }

  return {
    supabase,
    patient: {
      patientId: data.id,
      firstName: data.first_name?.trim() || fallback.firstName,
      lastName: data.last_name?.trim() || fallback.lastName,
      email: data.email?.trim() || "",
      phone: data.phone?.trim() || "",
      sexAtBirth: data.sex_at_birth?.trim() || fallback.sexAtBirth,
      genderIdentity: data.gender_identity?.trim() || "",
      existsInDatabase: true,
    },
  };
}

export async function processIntakeSubmission(
  input: SubjectiveNote
): Promise<ProcessedEncounter> {
  const { supabase, patient } = await resolvePatientContext(input.patient_id);
  const primaryIssue =
    input.chief_complaint.summary.trim() || "Patient concern not specified";
  const questionnaireHistory = input.history_of_present_illness.summary.trim();

  const transformedInput: IntakeFormInput = {
    patient_info: {
      first_name: patient.firstName,
      last_name: patient.lastName,
      age: 0,
      sex_at_birth: patient.sexAtBirth,
      gender_identity: patient.genderIdentity,
      phone: patient.phone,
      email: patient.email,
    },
    chief_complaint: {
      primary_issue: primaryIssue,
      duration: "Not specified in questionnaire",
      severity_0_10: 5,
      onset: questionnaireHistory,
      aggravating_factors: "",
      relieving_factors: "",
    },
    symptom_keys: [],
    custom_symptoms: input.review_of_systems.summary,
    history: {
      conditions: input.past_medical_history.summary,
      medications: input.medications.summary,
      surgeries: "",
      family_history: "",
    },
    lifestyle: {
      diet: input.social_history.body.summary,
      exercise: "",
      sleep: "",
      stress: input.social_history.mind.summary,
      substance_use: "",
    },
    goals: {
      patient_priorities: "",
      expectations: primaryIssue,
    },
    metadata: { source: "web-modern" },
  };

  const normalizedIntake = normalizeIntakeSubmission(transformedInput);
  const assessmentResults = scorePatterns(normalizedIntake);
  const generated = await generateSoapDraft({
    intake: normalizedIntake,
    assessmentResults,
  });
  const encounterId = crypto.randomUUID();
  const patientId = patient.patientId;
  let persisted = false;

  if (supabase) {
    if (!patient.existsInDatabase) {
      const patientInsert = await supabase.from("patients").insert({
        id: patientId,
        first_name: normalizedIntake.patient_info.first_name,
        last_name: normalizedIntake.patient_info.last_name,
        dob: null,
        sex_at_birth: normalizedIntake.patient_info.sex_at_birth,
        gender_identity: normalizedIntake.patient_info.gender_identity,
        phone: normalizedIntake.patient_info.contact.phone,
        email: normalizedIntake.patient_info.contact.email,
      });

      if (patientInsert.error) {
        throw patientInsert.error;
      }
    }

    const encounterInsert = await supabase.from("encounters").insert({
      id: encounterId,
      patient_id: patientId,
      status: "submitted",
      chief_complaint: normalizedIntake.chief_complaint.primary_issue,
      submitted_at: normalizedIntake.metadata.submitted_at,
    });

    if (encounterInsert.error) {
      throw encounterInsert.error;
    }

    const intakeInsert = await supabase.from("intake_submissions").insert({
      encounter_id: encounterId,
      schema_version: normalizedIntake.schema_version,
      raw_json: input,
      normalized_json: normalizedIntake,
    });

    if (intakeInsert.error) {
      throw intakeInsert.error;
    }

    const assessmentInsert = await supabase.from("assessment_results").insert(
      assessmentResults.map((item) => ({
        encounter_id: encounterId,
        pattern_key: item.pattern_key,
        confidence: item.confidence,
        evidence: item.evidence,
        data_gaps: item.data_gaps,
        risk_level: item.risk_level,
        rank: item.rank,
      })),
    );

    if (assessmentInsert.error) {
      throw assessmentInsert.error;
    }

    const soapInsert = await supabase.from("soap_notes").upsert(
      {
        encounter_id: encounterId,
        subjective: generated.soap.subjective,
        objective: generated.soap.objective,
        assessment: generated.soap.assessment,
        plan: generated.soap.plan_draft,
        soap_json: generated.soap,
        prompt_version: generated.promptVersion,
        model: generated.model,
        review_status: "draft",
      },
      {
        onConflict: "encounter_id",
      },
    );

    if (soapInsert.error) {
      throw soapInsert.error;
    }

    persisted = true;
  }

  return {
    encounterId,
    patientId,
    persisted,
    normalizedIntake,
    assessmentResults,
    soap: generated.soap,
    promptVersion: generated.promptVersion,
    model: generated.model,
    usedFallback: generated.usedFallback,
    tokenUsage: "tokenUsage" in generated ? generated.tokenUsage : undefined,
  };
}

export async function storeAppointmentRequest(
  encounterId: string,
  input: AppointmentRequestInput,
) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      persisted: false,
      appointmentRequest: {
        status: "requested",
        requested_at: new Date().toISOString(),
        ...input,
      },
    };
  }

  const insert = await supabase.from("appointment_requests").upsert(
    {
      encounter_id: encounterId,
      preferred_day: input.preferred_day,
      preferred_time: input.preferred_time,
      notes: input.notes,
      status: "requested",
    },
    {
      onConflict: "encounter_id",
    },
  );

  if (insert.error) {
    throw insert.error;
  }

  return {
    persisted: true,
    appointmentRequest: {
      status: "requested",
      requested_at: new Date().toISOString(),
      ...input,
    },
  };
}
