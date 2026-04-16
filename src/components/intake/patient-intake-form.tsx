"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Send,
} from "lucide-react";
import {
  patientIntakeQuestionnaireSchema,
  type PatientIntakeQuestionnaireInput,
  type PatientIntakeQuestionnaire,
} from "@/lib/schemas/modern-soap";

const stepLabels = [
  "Chief Complaint",
  "HPI",
  "ROS",
  "PMH",
  "Medications",
  "Social History",
  "Demographics & Vitals",
  "Exam / Labs / Scores",
] as const;

export function PatientIntakeForm(props: {
  patientId: string;
  onSubmit: (values: PatientIntakeQuestionnaire) => Promise<void>;
  isSubmitting: boolean;
  submissionStatus: string;
  submissionError: string | null;
}) {
  const [step, setStep] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<
    PatientIntakeQuestionnaireInput,
    unknown,
    PatientIntakeQuestionnaire
  >({
    resolver: zodResolver(patientIntakeQuestionnaireSchema),
    defaultValues: {
      patient_id: props.patientId,
      subjective: {
        chief_complaint: { summary: "" },
        history_of_present_illness: {
          onset: "",
          duration: "",
          course: "",
          aggravating_factors: "",
          relieving_factors: "",
          prior_evaluation_treatment: "",
        },
        review_of_systems: {
          constitutional: "",
          cardiovascular: "",
          respiratory: "",
          gastrointestinal: "",
          neurological: "",
          musculoskeletal: "",
          other: "",
        },
        past_medical_history: {
          medical_conditions: "",
          surgeries_hospitalizations: "",
          family_history: "",
          allergies: "",
        },
        medications: {
          prescriptions: "",
          otc_supplements: "",
          adherence_issues: "",
        },
        social_history: {
          environment: {
            housing: "",
            occupation: "",
            sdoh: "",
            toxins_exposures: "",
          },
          body: {
            diet: "",
            exercise: "",
            substance_use: "",
          },
          mind: {
            stress: "",
            social_support: "",
            relationships: "",
          },
        },
      },
      objective: {
        demographics: {
          sex_at_birth: "",
          gender_identity: "",
        },
        vitals: {
          height: "",
          weight: "",
          blood_pressure: "",
          heart_rate: "",
        },
        physical_exam: {
          summary: "",
        },
        labs_and_imaging: {
          summary: "",
        },
        risk_scores: {
          summary: "",
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
        <p className="section-label">SOAP-Aligned Intake</p>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          Answer each section as specifically as possible. If something is not
          available, write `None`, `Unknown`, or `Not available` rather than
          leaving it blank.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {stepLabels.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={clsx(
              "rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
              index === step
                ? "border-transparent bg-[color:var(--foreground)] text-white"
                : "border-[color:var(--line)] bg-white text-[color:var(--muted-strong)]",
            )}
          >
            <div className="font-mono text-xs">{`0${index + 1}`}</div>
            <div className="mt-1 font-semibold">{label}</div>
          </button>
        ))}
      </div>

      <form className="space-y-8" onSubmit={handleSubmit(props.onSubmit)}>
        {step === 0 && (
          <FormSection
            title="Chief Complaint"
            subtitle="Capture the patient's main reason for the visit in one clear clinical sentence."
          >
            <Field
              label="What is the main concern or reason for today's visit?"
              hint="Example: Daily headaches with worsening fatigue for the last 3 weeks."
              error={errors.subjective?.chief_complaint?.summary?.message}
            >
              <textarea
                {...register("subjective.chief_complaint.summary")}
                className={textareaClassName}
              />
            </Field>
          </FormSection>
        )}

        {step === 1 && (
          <FormSection
            title="History of Present Illness"
            subtitle="Document onset, duration, course, severity, triggers, relief, and prior treatment."
          >
            <Field
              label="When did the problem start?"
              error={errors.subjective?.history_of_present_illness?.onset?.message}
            >
              <input
                {...register("subjective.history_of_present_illness.onset")}
                className={inputClassName}
              />
            </Field>
            <Field
              label="How long has it been present?"
              error={errors.subjective?.history_of_present_illness?.duration?.message}
            >
              <input
                {...register("subjective.history_of_present_illness.duration")}
                className={inputClassName}
              />
            </Field>
            <Field
              label="How has it changed over time?"
              hint="Constant vs intermittent, stable vs worsening, and impact on daily function."
              error={errors.subjective?.history_of_present_illness?.course?.message}
            >
              <textarea
                {...register("subjective.history_of_present_illness.course")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Severity from 0 to 10"
              error={errors.subjective?.history_of_present_illness?.severity_0_10?.message}
            >
              <input
                type="number"
                min={0}
                max={10}
                step={1}
                {...register(
                  "subjective.history_of_present_illness.severity_0_10",
                  { valueAsNumber: true },
                )}
                className={inputClassName}
              />
            </Field>
            <Field
              label="What makes it worse?"
              error={errors.subjective?.history_of_present_illness?.aggravating_factors?.message}
            >
              <textarea
                {...register(
                  "subjective.history_of_present_illness.aggravating_factors",
                )}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="What makes it better?"
              error={errors.subjective?.history_of_present_illness?.relieving_factors?.message}
            >
              <textarea
                {...register(
                  "subjective.history_of_present_illness.relieving_factors",
                )}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="What evaluation or treatment has already been tried?"
              error={errors.subjective?.history_of_present_illness?.prior_evaluation_treatment?.message}
            >
              <textarea
                {...register(
                  "subjective.history_of_present_illness.prior_evaluation_treatment",
                )}
                className={textareaClassName}
              />
            </Field>
          </FormSection>
        )}

        {step === 2 && (
          <FormSection
            title="Review of Systems"
            subtitle="Answer by body system. Use `None` when a category has no relevant symptoms."
          >
            <Field
              label="Constitutional"
              hint="Fatigue, fever, chills, weight change, night sweats."
              error={errors.subjective?.review_of_systems?.constitutional?.message}
            >
              <textarea
                {...register("subjective.review_of_systems.constitutional")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Cardiovascular"
              hint="Chest pain, palpitations, edema, exercise tolerance."
              error={errors.subjective?.review_of_systems?.cardiovascular?.message}
            >
              <textarea
                {...register("subjective.review_of_systems.cardiovascular")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Respiratory"
              hint="Cough, wheeze, shortness of breath, sleep breathing issues."
              error={errors.subjective?.review_of_systems?.respiratory?.message}
            >
              <textarea
                {...register("subjective.review_of_systems.respiratory")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Gastrointestinal"
              hint="Nausea, reflux, bloating, bowel changes, abdominal pain."
              error={errors.subjective?.review_of_systems?.gastrointestinal?.message}
            >
              <textarea
                {...register("subjective.review_of_systems.gastrointestinal")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Neurological"
              hint="Headache, dizziness, weakness, numbness, memory changes."
              error={errors.subjective?.review_of_systems?.neurological?.message}
            >
              <textarea
                {...register("subjective.review_of_systems.neurological")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Musculoskeletal"
              hint="Joint pain, stiffness, muscle pain, back pain, mobility issues."
              error={errors.subjective?.review_of_systems?.musculoskeletal?.message}
            >
              <textarea
                {...register("subjective.review_of_systems.musculoskeletal")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Other relevant symptoms"
              error={errors.subjective?.review_of_systems?.other?.message}
            >
              <textarea
                {...register("subjective.review_of_systems.other")}
                className={textareaClassName}
              />
            </Field>
          </FormSection>
        )}

        {step === 3 && (
          <FormSection
            title="Past Medical History"
            subtitle="Capture conditions, procedures, family history, and allergies."
          >
            <Field
              label="Past medical conditions and prior diagnoses"
              error={errors.subjective?.past_medical_history?.medical_conditions?.message}
            >
              <textarea
                {...register("subjective.past_medical_history.medical_conditions")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Surgeries or hospitalizations"
              error={errors.subjective?.past_medical_history?.surgeries_hospitalizations?.message}
            >
              <textarea
                {...register(
                  "subjective.past_medical_history.surgeries_hospitalizations",
                )}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Relevant family history"
              error={errors.subjective?.past_medical_history?.family_history?.message}
            >
              <textarea
                {...register("subjective.past_medical_history.family_history")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Allergies"
              hint="Medication, food, environmental, and reaction if known."
              error={errors.subjective?.past_medical_history?.allergies?.message}
            >
              <textarea
                {...register("subjective.past_medical_history.allergies")}
                className={textareaClassName}
              />
            </Field>
          </FormSection>
        )}

        {step === 4 && (
          <FormSection
            title="Medications"
            subtitle="List everything currently taken and any adherence concerns."
          >
            <Field
              label="Prescription medications"
              hint="Include dose and frequency if known."
              error={errors.subjective?.medications?.prescriptions?.message}
            >
              <textarea
                {...register("subjective.medications.prescriptions")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="OTC medications and supplements"
              error={errors.subjective?.medications?.otc_supplements?.message}
            >
              <textarea
                {...register("subjective.medications.otc_supplements")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Adherence issues or missed doses"
              error={errors.subjective?.medications?.adherence_issues?.message}
            >
              <textarea
                {...register("subjective.medications.adherence_issues")}
                className={textareaClassName}
              />
            </Field>
          </FormSection>
        )}

        {step === 5 && (
          <FormSection
            title="Social History"
            subtitle="Cover environment, body, and mind in a structured way."
          >
            <SectionDivider title="Environment" />
            <Field
              label="Housing"
              error={errors.subjective?.social_history?.environment?.housing?.message}
            >
              <textarea
                {...register("subjective.social_history.environment.housing")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Occupation"
              error={errors.subjective?.social_history?.environment?.occupation?.message}
            >
              <textarea
                {...register("subjective.social_history.environment.occupation")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Social determinants of health"
              hint="Food access, transport, finances, caregiving, safety, insurance."
              error={errors.subjective?.social_history?.environment?.sdoh?.message}
            >
              <textarea
                {...register("subjective.social_history.environment.sdoh")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Toxins or exposures"
              error={errors.subjective?.social_history?.environment?.toxins_exposures?.message}
            >
              <textarea
                {...register(
                  "subjective.social_history.environment.toxins_exposures",
                )}
                className={textareaClassName}
              />
            </Field>

            <SectionDivider title="Body" />
            <Field
              label="Diet"
              error={errors.subjective?.social_history?.body?.diet?.message}
            >
              <textarea
                {...register("subjective.social_history.body.diet")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Exercise"
              error={errors.subjective?.social_history?.body?.exercise?.message}
            >
              <textarea
                {...register("subjective.social_history.body.exercise")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Substance use"
              hint="Alcohol, tobacco, nicotine, cannabis, recreational drugs."
              error={errors.subjective?.social_history?.body?.substance_use?.message}
            >
              <textarea
                {...register("subjective.social_history.body.substance_use")}
                className={textareaClassName}
              />
            </Field>

            <SectionDivider title="Mind" />
            <Field
              label="Stress"
              error={errors.subjective?.social_history?.mind?.stress?.message}
            >
              <textarea
                {...register("subjective.social_history.mind.stress")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Social support"
              error={errors.subjective?.social_history?.mind?.social_support?.message}
            >
              <textarea
                {...register("subjective.social_history.mind.social_support")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Relationships"
              error={errors.subjective?.social_history?.mind?.relationships?.message}
            >
              <textarea
                {...register("subjective.social_history.mind.relationships")}
                className={textareaClassName}
              />
            </Field>
          </FormSection>
        )}

        {step === 6 && (
          <FormSection
            title="Objective: Demographics and Vitals"
            subtitle="Enter the most recent known values. If unknown, say `Unknown` or `Not available`."
          >
            <Field
              label="Age"
              error={errors.objective?.demographics?.age?.message}
            >
              <input
                type="number"
                min={0}
                max={120}
                step={1}
                {...register("objective.demographics.age", {
                  valueAsNumber: true,
                })}
                className={inputClassName}
              />
            </Field>
            <Field
              label="Sex at birth"
              error={errors.objective?.demographics?.sex_at_birth?.message}
            >
              <input
                {...register("objective.demographics.sex_at_birth")}
                className={inputClassName}
              />
            </Field>
            <Field
              label="Gender identity"
              error={errors.objective?.demographics?.gender_identity?.message}
            >
              <input
                {...register("objective.demographics.gender_identity")}
                className={inputClassName}
              />
            </Field>
            <Field
              label="Height"
              error={errors.objective?.vitals?.height?.message}
            >
              <input
                {...register("objective.vitals.height")}
                className={inputClassName}
              />
            </Field>
            <Field
              label="Weight"
              error={errors.objective?.vitals?.weight?.message}
            >
              <input
                {...register("objective.vitals.weight")}
                className={inputClassName}
              />
            </Field>
            <Field
              label="Blood pressure"
              hint="Example: 128/82."
              error={errors.objective?.vitals?.blood_pressure?.message}
            >
              <input
                {...register("objective.vitals.blood_pressure")}
                className={inputClassName}
              />
            </Field>
            <Field
              label="Heart rate"
              error={errors.objective?.vitals?.heart_rate?.message}
            >
              <input
                {...register("objective.vitals.heart_rate")}
                className={inputClassName}
              />
            </Field>
          </FormSection>
        )}

        {step === 7 && (
          <FormSection
            title="Objective: Physical Exam, Labs, and Risk Scores"
            subtitle="Use the most recent available information from prior visits or reports."
          >
            <Field
              label="Physical exam findings"
              hint="If no recent physical exam is available, write `Not available`."
              error={errors.objective?.physical_exam?.summary?.message}
            >
              <textarea
                {...register("objective.physical_exam.summary")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Labs and imaging"
              hint="Include dates if known."
              error={errors.objective?.labs_and_imaging?.summary?.message}
            >
              <textarea
                {...register("objective.labs_and_imaging.summary")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Risk scores"
              hint="Examples: ASCVD, PREVENT, stage-based scores, or `Not available`."
              error={errors.objective?.risk_scores?.summary?.message}
            >
              <textarea
                {...register("objective.risk_scores.summary")}
                className={textareaClassName}
              />
            </Field>
          </FormSection>
        )}

        <div className="flex flex-col gap-3 border-t border-[color:var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[color:var(--muted)]">
            <span className="font-semibold text-[color:var(--foreground)]">
              {props.submissionStatus}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {step < stepLabels.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setStep((current) => Math.min(stepLabels.length - 1, current + 1))
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--foreground)] px-4 py-3 text-sm font-semibold text-white shadow-md hover:opacity-92"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={props.isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {props.isSubmitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit Intake
              </button>
            )}
          </div>
        </div>

        {props.submissionError ? (
          <div className="rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/8 px-4 py-3 text-sm text-[color:var(--danger)]">
            {props.submissionError}
          </div>
        ) : null}
      </form>
    </div>
  );
}

function FormSection(props: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5 rounded-[1.75rem] border border-[color:var(--line)] bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
          {props.title}
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          {props.subtitle}
        </p>
      </div>
      <div className="space-y-5">{props.children}</div>
    </div>
  );
}

function SectionDivider(props: { title: string }) {
  return (
    <div className="border-t border-[color:var(--line)] pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
        {props.title}
      </h3>
    </div>
  );
}

function Field(props: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-medium text-[color:var(--foreground)]">
        {props.label}
      </span>
      {props.hint ? (
        <span className="text-sm leading-6 text-[color:var(--muted)]">
          {props.hint}
        </span>
      ) : null}
      {props.children}
      {props.error ? (
        <span className="text-sm text-[color:var(--danger)]">{props.error}</span>
      ) : null}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20";

const textareaClassName = `${inputClassName} min-h-28 resize-y`;
