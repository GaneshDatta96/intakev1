"use client";

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
    subjectiveNoteSchema,
    type SubjectiveNote,
} from '@/lib/schemas/modern-soap';
import { useState } from "react";

const stepLabels = [
  "Chief Complaint",
  "History of Present Illness",
  "Review of Systems",
  "Past Medical History",
  "Medications",
  "Social History",
] as const;


export function PatientIntakeForm(props: {
  patientId: string;
  onSubmit: (values: SubjectiveNote) => Promise<void>;
  isSubmitting: boolean;
  submissionStatus: string;
  submissionError: string | null;
}) {
  const [step, setStep] = useState(0);

  const { register, handleSubmit } = useForm<SubjectiveNote>({
    resolver: zodResolver(subjectiveNoteSchema),
    defaultValues: {
        patient_id: props.patientId,
        chief_complaint: "",
        history_of_present_illness: "",
        review_of_systems: "",
        past_medical_history: "",
        medications: "",
        social_history_environment: { housing: "", occupation: "", sdoh: "", toxins_exposures: "" },
        social_history_body: { diet: "", exercise: "", substance_use: "" },
        social_history_mind: { stress: "", social_support: "", relationships: "" },
    }
  });

  return (
    <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {stepLabels.map((label, index) => (
            <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={clsx(
                "rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
                index === step
                    ? "border-transparent bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-600"
                )}
            >
                <div className="font-mono text-xs">{`0${index + 1}`}</div>
                <div className="mt-1 font-semibold">{label}</div>
            </button>
            ))}
        </div>

      <form className="space-y-8" onSubmit={handleSubmit(props.onSubmit)}>
        {step === 0 && (
          <FormSection title="Chief Complaint">
            <Field label="What is the primary reason for your visit today?">
                <textarea {...register("chief_complaint")} className={textareaClassName} />
            </Field>
          </FormSection>
        )}

        {step === 1 && (
            <FormSection title="History of Present Illness">
                <Field label="Describe the history of your present illness.">
                    <textarea {...register("history_of_present_illness")} className={textareaClassName} />
                </Field>
            </FormSection>
        )}

        {step === 2 && (
            <FormSection title="Review of Systems">
                <Field label="Please list any symptoms or issues you are experiencing, organized by body system.">
                    <textarea {...register("review_of_systems")} className={textareaClassName} />
                </Field>
            </FormSection>
        )}

        {step === 3 && (
            <FormSection title="Past Medical History">
                <Field label="Please list any past medical conditions, surgeries, or hospitalizations.">
                    <textarea {...register("past_medical_history")} className={textareaClassName} />
                </Field>
            </FormSection>
        )}

        {step === 4 && (
            <FormSection title="Medications">
                <Field label="Please list all medications you are currently taking, including dosage and frequency.">
                    <textarea {...register("medications")} className={textareaClassName} />
                </Field>
            </FormSection>
        )}

        {step === 5 && (
            <FormSection title="Social History">
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800">Environment</h3>
                    <Field label="Housing Situation">
                        <input {...register("social_history_environment.housing")} className={inputClassName} />
                    </Field>
                    <Field label="Occupation">
                        <input {...register("social_history_environment.occupation")} className={inputClassName} />
                    </Field>
                    <Field label="Social Determinants of Health (SDOH)">
                        <input {...register("social_history_environment.sdoh")} className={inputClassName} />
                    </Field>
                    <Field label="Toxins/Exposures">
                        <input {...register("social_history_environment.toxins_exposures")} className={inputClassName} />
                    </Field>

                    <h3 className="mt-8 text-xl font-semibold text-gray-800">Body</h3>
                    <Field label="Diet">
                        <textarea {...register("social_history_body.diet")} className={textareaClassName} />
                    </Field>
                    <Field label="Exercise">
                        <textarea {...register("social_history_body.exercise")} className={textareaClassName} />
                    </Field>
                    <Field label="Substance Use">
                        <textarea {...register("social_history_body.substance_use")} className={textareaClassName} />
                    </Field>

                    <h3 className="mt-8 text-xl font-semibold text-gray-800">Mind</h3>
                    <Field label="Stress">
                        <textarea {...register("social_history_mind.stress")} className={textareaClassName} />
                    </Field>
                    <Field label="Social Support">
                        <textarea {...register("social_history_mind.social_support")} className={textareaClassName} />
                    </Field>
                    <Field label="Relationships">
                        <textarea {...register("social_history_mind.relationships")} className={textareaClassName} />
                    </Field>
                </div>
            </FormSection>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">
              {props.submissionStatus}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {step < stepLabels.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(stepLabels.length - 1, current + 1))}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={props.isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        {props.submissionError && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {props.submissionError}
          </div>
        )}
      </form>
    </div>
  );
}

function FormSection(props: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{props.title}</h2>
            <div className="space-y-4">{props.children}</div>
        </div>
    );
}


function Field(props: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-medium text-gray-800">{props.label}</span>
      {props.children}
      {props.error && (
        <span className="text-sm text-red-600">{props.error}</span>
      )}
    </label>
  );
}

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50";

const textareaClassName = `${inputClassName} min-h-32 resize-y`;
