import { generateSoapDraft } from "@/lib/ai/generate-soap";
import { scorePatterns } from "@/lib/assessment/score-patterns";
import { getClinicByNiche } from "@/lib/clinics/niche-configs";
import { getClinicForSlug } from "@/lib/clinics/store";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { transformNicheSubmission } from "@/lib/intake/niche-intake";
import {
  type AppointmentRequestInput,
  type NormalizedIntake,
} from "@/lib/schemas/intake";
import { type NicheIntakePayload } from "@/lib/schemas/niche-intake";
import { type AssessmentResult, type SoapDraft } from "@/lib/schemas/soap";

export type ProcessedEncounter = {
  encounterId: string | null;
  patientId: string;
  persisted: boolean;
  supportsAppointments: boolean;
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
  clinicId?: string;
  existsInDatabase: boolean;
  storageMode: "legacy" | "tenant" | "ephemeral";
};

function splitName(name: string) {
  const [firstName = "Demo", ...rest] = name.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" ") || "Patient",
  };
}

function buildFallbackPatientContext(
  patientId: string,
  clinicId?: string,
): ResolvedPatientContext {
  return {
    patientId,
    firstName: "Demo",
    lastName: "Patient",
    email: "",
    phone: "",
    sexAtBirth: "Not specified",
    genderIdentity: "",
    clinicId,
    existsInDatabase: false,
    storageMode: "ephemeral",
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

  const legacyPatient = await supabase
    .from("patients")
    .select(
      "id, first_name, last_name, email, phone, sex_at_birth, gender_identity",
    )
    .eq("id", patientId)
    .maybeSingle();

  if (!legacyPatient.error && legacyPatient.data) {
    return {
      supabase,
      patient: {
        patientId: legacyPatient.data.id,
        firstName: legacyPatient.data.first_name?.trim() || fallback.firstName,
        lastName: legacyPatient.data.last_name?.trim() || fallback.lastName,
        email: legacyPatient.data.email?.trim() || "",
        phone: legacyPatient.data.phone?.trim() || "",
        sexAtBirth: legacyPatient.data.sex_at_birth?.trim() || fallback.sexAtBirth,
        genderIdentity: legacyPatient.data.gender_identity?.trim() || "",
        existsInDatabase: true,
        storageMode: "legacy" as const,
      },
    };
  }

  const tenantPatient = await supabase
    .from("patients")
    .select("id, clinic_id, name, email, phone")
    .eq("id", patientId)
    .maybeSingle();

  if (!tenantPatient.error && tenantPatient.data) {
    const parsedName = splitName(tenantPatient.data.name ?? "");

    return {
      supabase,
      patient: {
        patientId: tenantPatient.data.id,
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
        email: tenantPatient.data.email?.trim() || "",
        phone: tenantPatient.data.phone?.trim() || "",
        sexAtBirth: fallback.sexAtBirth,
        genderIdentity: "",
        clinicId: tenantPatient.data.clinic_id ?? undefined,
        existsInDatabase: true,
        storageMode: "tenant" as const,
      },
    };
  }

  return {
    supabase,
    patient: fallback,
  };
}

async function persistToTenantSchema(args: {
  clinicId: string;
  patient: ResolvedPatientContext;
  input: NicheIntakePayload;
  normalizedIntake: NormalizedIntake;
  assessmentResults: AssessmentResult[];
  generated: Awaited<ReturnType<typeof generateSoapDraft>>;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      persisted: false,
      encounterId: null,
      supportsAppointments: false,
    };
  }

  if (!args.patient.existsInDatabase) {
    const patientInsert = await supabase.from("patients").insert({
      id: args.patient.patientId,
      clinic_id: args.clinicId,
      name: `${args.patient.firstName} ${args.patient.lastName}`.trim(),
      email: args.patient.email || null,
      phone: args.patient.phone || null,
    });

    if (patientInsert.error) {
      return {
        persisted: false,
        encounterId: null,
        supportsAppointments: false,
      };
    }
  }

  const intakeInsert = await supabase
    .from("intakes")
    .insert({
      patient_id: args.patient.patientId,
      clinic_id: args.clinicId,
      intake_json: {
        raw: args.input,
        normalized: args.normalizedIntake,
        assessment_results: args.assessmentResults,
      },
    })
    .select("id")
    .single();

  if (intakeInsert.error || !intakeInsert.data) {
    return {
      persisted: false,
      encounterId: null,
      supportsAppointments: false,
    };
  }

  const soapInsert = await supabase
    .from("soap_reports")
    .insert({
      patient_id: args.patient.patientId,
      clinic_id: args.clinicId,
      soap_json: {
        ...args.generated.soap,
        prompt_version: args.generated.promptVersion,
        model: args.generated.model,
        used_fallback: args.generated.usedFallback,
      },
    })
    .select("id")
    .single();

  if (soapInsert.error) {
    return {
      persisted: false,
      encounterId: null,
      supportsAppointments: false,
    };
  }

  return {
    persisted: true,
    encounterId: intakeInsert.data.id,
    supportsAppointments: false,
  };
}

async function persistToLegacySchema(args: {
  patient: ResolvedPatientContext;
  normalizedIntake: NormalizedIntake;
  input: NicheIntakePayload;
  assessmentResults: AssessmentResult[];
  generated: Awaited<ReturnType<typeof generateSoapDraft>>;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      persisted: false,
      encounterId: null,
      supportsAppointments: false,
    };
  }

  const encounterId = crypto.randomUUID();

  if (!args.patient.existsInDatabase) {
    const patientInsert = await supabase.from("patients").insert({
      id: args.patient.patientId,
      first_name: args.normalizedIntake.patient_info.first_name,
      last_name: args.normalizedIntake.patient_info.last_name,
      dob: null,
      sex_at_birth: args.normalizedIntake.patient_info.sex_at_birth,
      gender_identity: args.normalizedIntake.patient_info.gender_identity,
      phone: args.normalizedIntake.patient_info.contact.phone,
      email: args.normalizedIntake.patient_info.contact.email,
    });

    if (patientInsert.error) {
      return {
        persisted: false,
        encounterId: null,
        supportsAppointments: false,
      };
    }
  }

  const encounterInsert = await supabase.from("encounters").insert({
    id: encounterId,
    patient_id: args.patient.patientId,
    status: "submitted",
    chief_complaint: args.normalizedIntake.chief_complaint.primary_issue,
    submitted_at: args.normalizedIntake.metadata.submitted_at,
  });

  if (encounterInsert.error) {
    return {
      persisted: false,
      encounterId: null,
      supportsAppointments: false,
    };
  }

  const intakeInsert = await supabase.from("intake_submissions").insert({
    encounter_id: encounterId,
    schema_version: args.normalizedIntake.schema_version,
    raw_json: args.input,
    normalized_json: args.normalizedIntake,
  });

  if (intakeInsert.error) {
    return {
      persisted: false,
      encounterId: null,
      supportsAppointments: false,
    };
  }

  const assessmentInsert = await supabase.from("assessment_results").insert(
    args.assessmentResults.map((item) => ({
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
    return {
      persisted: false,
      encounterId: null,
      supportsAppointments: false,
    };
  }

  const soapInsert = await supabase.from("soap_notes").upsert(
    {
      encounter_id: encounterId,
      subjective: args.generated.soap.subjective,
      objective: args.generated.soap.objective,
      assessment: args.generated.soap.assessment,
      plan: args.generated.soap.plan_draft,
      soap_json: args.generated.soap,
      prompt_version: args.generated.promptVersion,
      model: args.generated.model,
      review_status: "draft",
    },
    {
      onConflict: "encounter_id",
    },
  );

  if (soapInsert.error) {
    return {
      persisted: false,
      encounterId: null,
      supportsAppointments: false,
    };
  }

  return {
    persisted: true,
    encounterId,
    supportsAppointments: true,
  };
}

export async function processIntakeSubmission(
  input: NicheIntakePayload,
): Promise<ProcessedEncounter> {
  const clinic = (await getClinicForSlug(input.clinic_slug)) ?? getClinicByNiche(input.niche);

  if (!clinic) {
    throw new Error("Unable to resolve clinic config for intake submission.");
  }

  const { supabase, patient } = await resolvePatientContext(input.patient_id);
  const transformed = transformNicheSubmission({
    clinic,
    payload: input,
    patient: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      sexAtBirth: patient.sexAtBirth,
      genderIdentity: patient.genderIdentity,
    },
  });
  const normalizedIntake = transformed.normalizedIntake;
  const assessmentResults = scorePatterns(normalizedIntake);
  const generated = await generateSoapDraft({
    intake: normalizedIntake,
    assessmentResults,
    clinic,
    soapContext: transformed.soapContext,
  });
  const patientId = patient.patientId;

  let persisted = false;
  let encounterId: string | null = null;
  let supportsAppointments = false;

  if (supabase) {
    const tenantClinicId = patient.clinicId ?? clinic.id;

    if (tenantClinicId) {
      const tenantResult = await persistToTenantSchema({
        clinicId: tenantClinicId,
        patient,
        input,
        normalizedIntake,
        assessmentResults,
        generated,
      });

      persisted = tenantResult.persisted;
      encounterId = tenantResult.encounterId;
      supportsAppointments = tenantResult.supportsAppointments;
    }

    if (!persisted) {
      const legacyResult = await persistToLegacySchema({
        patient,
        normalizedIntake,
        input,
        assessmentResults,
        generated,
      });

      persisted = legacyResult.persisted;
      encounterId = legacyResult.encounterId;
      supportsAppointments = legacyResult.supportsAppointments;
    }
  }

  return {
    encounterId,
    patientId,
    persisted,
    supportsAppointments,
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
