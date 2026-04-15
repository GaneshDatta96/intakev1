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
  intakeFormSchema,
  symptomCatalog,
  type IntakeFormInput,
  type IntakeFormValues,
} from "@/lib/schemas/intake";
import { useState } from "react";

const stepLabels = [
  "Basic Info",
  "Chief Complaint",
  "Symptoms",
  "Medical History",
  "Lifestyle",
  "Goals",
] as const;

const defaultValues: IntakeFormInput = {
    patient_info: {
      first_name: "Maria",
      last_name: "Cole",
      age: 42,
      sex_at_birth: "Female",
      gender_identity: "Female",
      phone: "(555) 014-3377",
      email: "maria@example.com",
    },
    chief_complaint: {
      primary_issue: "Bloating and irregular bowel habits",
      duration: "4 months",
      severity_0_10: 7,
      onset: "Gradual",
      aggravating_factors: "large meals, stress",
      relieving_factors: "lighter meals, rest",
    },
    symptom_keys: ["bloating", "gas", "brain_fog", "high_stress"],
    custom_symptoms: "Loose stools after restaurant meals",
    history: {
      conditions: "Seasonal allergies",
      medications: "Recent antibiotics",
      surgeries: "",
      family_history: "Mother with IBS",
    },
    lifestyle: {
      diet: "Frequent takeout and sugary snacks during busy weeks",
      exercise: "Minimal exercise",
      sleep: "Broken sleep 5-6 hours",
      stress: "High stress at work",
      substance_use: "2 coffees daily, social alcohol",
    },
    goals: {
      patient_priorities: "reduce bloating, improve energy",
      expectations: "understand triggers and get a clear plan",
    },
    metadata: {
      source: "web",
    },
  };

export function PatientIntakeForm(props: {
  onSubmit: (values: IntakeFormInput) => Promise<void>;
  isSubmitting: boolean;
  submissionStatus: string;
  submissionError: string | null;
}) {
  const [step, setStep] = useState(0);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<IntakeFormValues, unknown, IntakeFormInput>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues,
  });

  const selectedSymptoms = watch("symptom_keys") ?? [];

  const toggleSymptom = (symptomKey: string) => {
    const nextValues = selectedSymptoms.includes(symptomKey)
      ? selectedSymptoms.filter((item) => item !== symptomKey)
      : [...selectedSymptoms, symptomKey];

    setValue("symptom_keys", nextValues, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

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
                ? "border-transparent bg-[color:var(--foreground)] text-[color:var(--background)]"
                : "border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--muted)]"
            )}
          >
            <div className="font-mono text-xs">{`0${index + 1}`}</div>
            <div className="mt-1 font-semibold">{label}</div>
          </button>
        ))}
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(props.onSubmit)}>
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="First name"
              error={errors.patient_info?.first_name?.message}
            >
              <input
                {...register("patient_info.first_name")}
                className={inputClassName}
              />
            </Field>
            <Field
              label="Last name"
              error={errors.patient_info?.last_name?.message}
            >
              <input
                {...register("patient_info.last_name")}
                className={inputClassName}
              />
            </Field>
            <Field label="Age" error={errors.patient_info?.age?.message}>
              <input
                type="number"
                {...register("patient_info.age", { valueAsNumber: true })}
                className={inputClassName}
              />
            </Field>
            <Field
              label="Sex at birth"
              error={errors.patient_info?.sex_at_birth?.message}
            >
              <select
                {...register("patient_info.sex_at_birth")}
                className={inputClassName}
              >
                <option value="">Select</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Intersex">Intersex</option>
              </select>
            </Field>
            <Field label="Gender identity">
              <input
                {...register("patient_info.gender_identity")}
                className={inputClassName}
              />
            </Field>
            <Field label="Phone">
              <input
                {...register("patient_info.phone")}
                className={inputClassName}
              />
            </Field>
            <Field label="Email" error={errors.patient_info?.email?.message}>
              <input
                {...register("patient_info.email")}
                className={inputClassName}
              />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Primary issue"
              error={errors.chief_complaint?.primary_issue?.message}
            >
              <textarea
                {...register("chief_complaint.primary_issue")}
                className={textareaClassName}
              />
            </Field>
            <Field
              label="Duration"
              error={errors.chief_complaint?.duration?.message}
            >
              <input
                {...register("chief_complaint.duration")}
                className={inputClassName}
              />
            </Field>
            <Field label="Severity (0-10)">
              <input
                type="number"
                {...register("chief_complaint.severity_0_10", {
                  valueAsNumber: true,
                })}
                className={inputClassName}
              />
            </Field>
            <Field label="Onset">
              <input
                {...register("chief_complaint.onset")}
                className={inputClassName}
              />
            </Field>
            <Field label="Aggravating factors">
              <textarea
                {...register("chief_complaint.aggravating_factors")}
                className={textareaClassName}
              />
            </Field>
            <Field label="Relieving factors">
              <textarea
                {...register("chief_complaint.relieving_factors")}
                className={textareaClassName}
              />
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {symptomCatalog.map((symptom) => {
                const checked = selectedSymptoms.includes(symptom.key);

                return (
                  <button
                    key={symptom.key}
                    type="button"
                    onClick={() => toggleSymptom(symptom.key)}
                    className={clsx(
                      "rounded-2xl border px-4 py-4 text-left transition-colors",
                      checked
                        ? "border-transparent bg-[color:var(--accent)] text-white"
                        : "border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                    )}
                  >
                    <div className="text-sm font-semibold">{symptom.label}</div>
                    <div className="mt-2 text-xs opacity-75">
                      {checked ? "Selected" : "Tap to include"}
                    </div>
                  </button>
                );
              })}
            </div>
            <Field label="Custom symptoms">
              <textarea
                {...register("custom_symptoms")}
                className={textareaClassName}
                placeholder="One per line or comma separated"
              />
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4">
            <Field label="Conditions">
              <textarea
                {...register("history.conditions")}
                className={textareaClassName}
                placeholder="Comma separated"
              />
            </Field>
            <Field label="Medications">
              <textarea
                {...register("history.medications")}
                className={textareaClassName}
                placeholder="Comma separated"
              />
            </Field>
            <Field label="Surgeries">
              <textarea
                {...register("history.surgeries")}
                className={textareaClassName}
                placeholder="Comma separated"
              />
            </Field>
            <Field label="Family history">
              <textarea
                {...register("history.family_history")}
                className={textareaClassName}
                placeholder="Comma separated"
              />
            </Field>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-4">
            <Field label="Diet">
              <textarea
                {...register("lifestyle.diet")}
                className={textareaClassName}
              />
            </Field>
            <Field label="Exercise">
              <textarea
                {...register("lifestyle.exercise")}
                className={textareaClassName}
              />
            </Field>
            <Field label="Sleep">
              <textarea
                {...register("lifestyle.sleep")}
                className={textareaClassName}
              />
            </Field>
            <Field label="Stress">
              <textarea
                {...register("lifestyle.stress")}
                className={textareaClassName}
              />
            </Field>
            <Field label="Substance use">
              <textarea
                {...register("lifestyle.substance_use")}
                className={textareaClassName}
              />
            </Field>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4">
            <Field label="Patient priorities">
              <textarea
                {...register("goals.patient_priorities")}
                className={textareaClassName}
                placeholder="Comma separated"
              />
            </Field>
            <Field label="Expectations">
              <textarea
                {...register("goals.expectations")}
                className={textareaClassName}
              />
            </Field>
          </div>
        ) : null}

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
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] px-4 py-3 text-sm font-semibold"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {step < stepLabels.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setStep((current) =>
                    Math.min(stepLabels.length - 1, current + 1)
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--foreground)] px-4 py-3 text-sm font-semibold text-[color:var(--background)]"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={props.isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
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

function Field(props: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{props.label}</span>
      {props.children}
      {props.error ? (
        <span className="text-sm text-[color:var(--danger)]">{props.error}</span>
      ) : null}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]";

const textareaClassName = `${inputClassName} min-h-28 resize-y`;
