import { buildFallbackSoap } from "@/lib/ai/generate-soap";
import { patternLibrary } from "@/lib/assessment/pattern-library";
import { scorePatterns } from "@/lib/assessment/score-patterns";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import { buildSampleCases } from "@/lib/demo/sample-cases";
import {
  normalizedIntakeSchema,
  type AppointmentRequestInput,
  type NormalizedIntake,
} from "@/lib/schemas/intake";
import { assessmentResultSchema, soapDraftSchema, type AssessmentResult, type SoapDraft } from "@/lib/schemas/soap";

const patternLabelByKey = new Map(
  patternLibrary.map((pattern) => [pattern.key, pattern.label]),
);

type EncounterRow = {
  id: string;
  status: string;
  chief_complaint: string;
  submitted_at: string | null;
  reviewed_at: string | null;
};

type IntakeSubmissionRow = {
  encounter_id: string;
  normalized_json: unknown;
  created_at: string;
};

type AssessmentRow = {
  encounter_id: string;
  pattern_key: string;
  confidence: number;
  evidence: unknown;
  data_gaps: unknown;
  risk_level: "routine" | "priority" | "urgent_review";
  rank: number;
};

type SoapRow = {
  encounter_id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  soap_json: unknown;
  review_status: string;
};

type AppointmentRequestRow = AppointmentRequestInput & {
  encounter_id: string;
  requested_at: string;
  status: string;
};

export type DashboardCase = {
  id: string;
  patient: NormalizedIntake["patient_info"];
  chief_complaint: string;
  normalized_intake: NormalizedIntake;
  assessment: {
    results: AssessmentResult[];
  };
  soap: SoapDraft;
  submitted_at: string;
  encounter_status: string;
  reviewed_at: string | null;
  soap_review_status: string;
  appointment_request: (AppointmentRequestInput & {
    requested_at: string;
    status: string;
  }) | null;
  source: "supabase" | "demo";
};

function groupByEncounterId<T extends { encounter_id: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((grouped, row) => {
    grouped[row.encounter_id] ??= [];
    grouped[row.encounter_id].push(row);
    return grouped;
  }, {});
}

function parseAssessmentRows(rows: AssessmentRow[]) {
  return rows
    .sort((left, right) => left.rank - right.rank)
    .map((row) =>
      assessmentResultSchema.parse({
        pattern_key: row.pattern_key,
        label: patternLabelByKey.get(row.pattern_key) ?? row.pattern_key,
        confidence: Number(row.confidence),
        risk_level: row.risk_level,
        evidence: Array.isArray(row.evidence) ? row.evidence : [],
        data_gaps: Array.isArray(row.data_gaps) ? row.data_gaps : [],
        matched_context: [],
        rank: row.rank,
      }),
    );
}

function parseSoap(row: SoapRow | undefined, intake: NormalizedIntake, assessmentResults: AssessmentResult[]) {
  if (!row) {
    return {
      soap: buildFallbackSoap(intake, assessmentResults),
      reviewStatus: "draft",
    };
  }

  const parsed = soapDraftSchema.safeParse(row.soap_json);

  if (parsed.success) {
    return {
      soap: parsed.data,
      reviewStatus: row.review_status,
    };
  }

  return {
    soap: soapDraftSchema.parse({
      subjective: row.subjective,
      objective: row.objective,
      assessment: row.assessment,
      plan_draft: row.plan,
    }),
    reviewStatus: row.review_status,
  };
}

async function loadAppointmentRequests(encounterIds: string[]) {
  const supabase = getSupabaseAdmin();

  if (!supabase || encounterIds.length === 0) {
    return {} as Record<string, AppointmentRequestRow[]>;
  }

  const response = await supabase
    .from("appointment_requests")
    .select("encounter_id, preferred_day, preferred_time, notes, requested_at, status")
    .in("encounter_id", encounterIds);

  if (response.error) {
    return {} as Record<string, AppointmentRequestRow[]>;
  }

  return groupByEncounterId((response.data ?? []) as AppointmentRequestRow[]);
}

function mapDemoCases(): DashboardCase[] {
  return buildSampleCases().map((item) => ({
    ...item,
    encounter_status: "demo",
    reviewed_at: null,
    soap_review_status: "draft",
    appointment_request: null,
    source: "demo",
  }));
}

export async function getDashboardCases(): Promise<DashboardCase[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return mapDemoCases();
  }

  const encountersResponse = await supabase
    .from("encounters")
    .select("id, status, chief_complaint, submitted_at, reviewed_at")
    .order("submitted_at", { ascending: false, nullsFirst: false });

  if (encountersResponse.error) {
    return mapDemoCases();
  }

  const encounters = (encountersResponse.data ?? []) as EncounterRow[];

  if (encounters.length === 0) {
    return [];
  }

  const encounterIds = encounters.map((item) => item.id);

  const [intakeResponse, assessmentResponse, soapResponse, appointmentByEncounter] =
    await Promise.all([
      supabase
        .from("intake_submissions")
        .select("encounter_id, normalized_json, created_at")
        .in("encounter_id", encounterIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("assessment_results")
        .select("encounter_id, pattern_key, confidence, evidence, data_gaps, risk_level, rank")
        .in("encounter_id", encounterIds)
        .order("rank", { ascending: true }),
      supabase
        .from("soap_notes")
        .select("encounter_id, subjective, objective, assessment, plan, soap_json, review_status")
        .in("encounter_id", encounterIds),
      loadAppointmentRequests(encounterIds),
    ]);

  const intakeRows = groupByEncounterId((intakeResponse.data ?? []) as IntakeSubmissionRow[]);
  const assessmentRows = groupByEncounterId(
    (assessmentResponse.data ?? []) as AssessmentRow[],
  );
  const soapRows = groupByEncounterId((soapResponse.data ?? []) as SoapRow[]);

  return encounters.flatMap((encounter) => {
    const latestIntake = intakeRows[encounter.id]?.[0];
    const parsedIntake = normalizedIntakeSchema.safeParse(latestIntake?.normalized_json);

    if (!parsedIntake.success) {
      return [];
    }

    const normalizedIntake = parsedIntake.data;
    const parsedAssessment =
      assessmentRows[encounter.id] && assessmentRows[encounter.id].length > 0
        ? parseAssessmentRows(assessmentRows[encounter.id])
        : scorePatterns(normalizedIntake);
    const parsedSoap = parseSoap(soapRows[encounter.id]?.[0], normalizedIntake, parsedAssessment);
    const appointmentRequest = appointmentByEncounter[encounter.id]?.[0] ?? null;

    return [
      {
        id: encounter.id,
        patient: normalizedIntake.patient_info,
        chief_complaint:
          encounter.chief_complaint ?? normalizedIntake.chief_complaint.primary_issue,
        normalized_intake: normalizedIntake,
        assessment: {
          results: parsedAssessment,
        },
        soap: parsedSoap.soap,
        submitted_at:
          encounter.submitted_at ?? normalizedIntake.metadata.submitted_at,
        encounter_status: encounter.status,
        reviewed_at: encounter.reviewed_at,
        soap_review_status: parsedSoap.reviewStatus,
        appointment_request: appointmentRequest,
        source: "supabase",
      },
    ];
  });
}
