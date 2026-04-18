"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import clsx from "clsx";
import { LoaderCircle, Send } from "lucide-react";
import { type ClinicDefinition } from "@/lib/clinics/niche-configs";
import {
  buildNicheIntakeSubmissionSchema,
  getDefaultAnswerValue,
  type NicheIntakePayload,
} from "@/lib/schemas/niche-intake";

export function PatientIntakeForm(props: {
  patientId: string;
  clinic: ClinicDefinition;
  onSubmit: (values: NicheIntakePayload) => Promise<void>;
  isSubmitting: boolean;
  submissionStatus: string;
  submissionError: string | null;
}) {
  const formSchema = buildNicheIntakeSubmissionSchema(props.clinic.config);
  type FormInput = z.input<typeof formSchema>;
  const defaultAnswers = Object.fromEntries(
    props.clinic.config.questionnaire.map((question) => [
      question.key,
      getDefaultAnswerValue(question),
    ]),
  );
  const [scaleValues, setScaleValues] = useState<Record<string, number>>(
    Object.fromEntries(
      props.clinic.config.questionnaire
        .filter((question) => question.type === "scale")
        .map((question) => [question.key, question.min]),
    ),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, NicheIntakePayload>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_id: props.patientId,
      clinic_slug: props.clinic.slug,
      niche: props.clinic.niche,
      answers: defaultAnswers,
    },
  });

  const answerErrors = (errors.answers ?? {}) as Record<
    string,
    { message?: string } | undefined
  >;

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 sm:p-6">
        <div className="space-y-3">
          <p className="section-label">{props.clinic.config.label}</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Dynamic questionnaire mapped to SOAP-ready output.
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
            Each answer below is rendered from the selected niche config and fed
            into a stronger Subjective and Assessment draft. Plan stays manual
            for the practitioner.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <SoapGuideCard label="S" title="Subjective" items={props.clinic.config.soap.S} />
          <SoapGuideCard label="O" title="Objective" items={props.clinic.config.soap.O} />
          <SoapGuideCard label="A" title="Assessment" items={props.clinic.config.soap.A} />
          <SoapGuideCard label="P" title="Plan" items={props.clinic.config.soap.P} />
        </div>
      </section>

      <form className="space-y-6" onSubmit={handleSubmit(props.onSubmit)}>
        <input type="hidden" {...register("patient_id")} />
        <input type="hidden" {...register("clinic_slug")} />
        <input type="hidden" {...register("niche")} />

        <div className="grid gap-4">
          {props.clinic.config.questionnaire.map((question, index) => {
            const fieldName = `answers.${question.key}` as const;
            const error = answerErrors[question.key]?.message;
            const scaleRegistration =
              question.type === "scale"
                ? register(fieldName, { valueAsNumber: true })
                : null;

            return (
              <div
                key={question.key}
                className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      Field {String(index + 1).padStart(2, "0")}
                    </p>
                    <label
                      htmlFor={question.key}
                      className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]"
                    >
                      {question.question}
                    </label>
                  </div>
                  <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-strong)]">
                    {question.type}
                  </span>
                </div>

                <div className="mt-5">
                  {question.type === "text" ? (
                    <textarea
                      id={question.key}
                      {...register(fieldName)}
                      className={textareaClassName}
                      placeholder="Write a clear, specific response."
                    />
                  ) : null}

                  {question.type === "select" ? (
                    <select
                      id={question.key}
                      {...register(fieldName)}
                      className={inputClassName}
                    >
                      <option value="">Select an option</option>
                      {question.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  {question.type === "multi" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <label
                          key={option}
                          className="flex items-start gap-3 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--foreground)]"
                        >
                          <input
                            type="checkbox"
                            value={option}
                            {...register(fieldName)}
                            className="mt-1 h-4 w-4 rounded border-[color:var(--line)]"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}

                  {question.type === "scale" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-[color:var(--muted)]">
                        <span>{question.min}</span>
                        <span className="rounded-full bg-[color:var(--accent)]/10 px-3 py-1 font-semibold text-[color:var(--accent)]">
                          {String(scaleValues[question.key] ?? question.min)}
                        </span>
                        <span>{question.max}</span>
                      </div>
                      <input
                        id={question.key}
                        type="range"
                        min={question.min}
                        max={question.max}
                        step={1}
                        {...scaleRegistration}
                        onChange={(event) => {
                          scaleRegistration?.onChange(event);
                          setScaleValues((current) => ({
                            ...current,
                            [question.key]: Number(event.target.value),
                          }));
                        }}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--line)] accent-[color:var(--accent)]"
                      />
                    </div>
                  ) : null}

                  {error ? (
                    <p className="mt-3 text-sm text-[color:var(--danger)]">{error}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 border-t border-[color:var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-[color:var(--muted)]">
            <p className="font-semibold text-[color:var(--foreground)]">
              {props.submissionStatus}
            </p>
            <p>
              Clinic route: <span className="font-mono">/{props.clinic.slug}</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={props.isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit Intake
          </button>
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

function SoapGuideCard(props: {
  label: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold tracking-[0.18em] text-[color:var(--muted)]">
          {props.label}
        </p>
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
            props.items.length > 0
              ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
              : "bg-[color:var(--line)] text-[color:var(--muted)]",
          )}
        >
          {props.items.length > 0 ? "Configured" : "Manual"}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">
        {props.title}
      </h3>
      <div className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--muted-strong)]">
        {props.items.length > 0 ? (
          props.items.map((item) => (
            <p key={item} className="rounded-2xl bg-[color:var(--surface-strong)] px-3 py-2">
              {item}
            </p>
          ))
        ) : (
          <p className="rounded-2xl bg-[color:var(--surface-strong)] px-3 py-2">
            Left intentionally manual for the clinician.
          </p>
        )}
      </div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20";

const textareaClassName = `${inputClassName} min-h-32 resize-y`;
