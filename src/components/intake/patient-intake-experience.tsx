"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, Copy, LoaderCircle, Send } from "lucide-react";
import { PatientIntakeForm } from "@/components/intake/patient-intake-form";
import {
  appointmentRequestSchema,
  type AppointmentRequestInput,
  type AppointmentRequestValues,
} from "@/lib/schemas/intake";
import { type SubjectiveNote } from "@/lib/schemas/modern-soap";
import { PatientCreationForm, type PatientDetails } from "./patient-creation-form";

type SubmissionState = {
  isSubmitted: boolean;
  pending: boolean;
  error: string | null;
  status: string;
  encounterId: string | null;
};

type BookingState = {
  pending: boolean;
  error: string | null;
  submitted: boolean;
  skipped: boolean;
};

export function PatientIntakeExperience(props: {
  initialPatientId?: string | null;
}) {
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submission, setSubmission] = useState<SubmissionState>({
    isSubmitted: false,
    pending: false,
    error: null,
    status: "Complete each section to prepare the intake.",
    encounterId: null,
  });
  const [bookingState, setBookingState] = useState<BookingState>({
    pending: false,
    error: null,
    submitted: false,
    skipped: false,
  });

  const activePatientId = patient?.id ?? props.initialPatientId ?? null;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const patientLink = activePatientId
    ? `${origin}/questionnaire?patientId=${activePatientId}`
    : null;

  async function handleCopyLink() {
    if (!patientLink || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(patientLink);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  }

  async function submitIntake(values: SubjectiveNote) {
    setSubmission({
      isSubmitted: false,
      pending: true,
      error: null,
      status: "Saving intake and preparing the practitioner view...",
      encounterId: null,
    });
    setBookingState({
      pending: false,
      error: null,
      submitted: false,
      skipped: false,
    });

    try {
      const response = await fetch("/api/intake/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const payload = (await response.json()) as {
        encounterId?: string;
        error?: string;
      };

      if (!response.ok || !payload.encounterId) {
        throw new Error(payload.error ?? "Submission failed.");
      }

      setSubmission({
        isSubmitted: true,
        pending: false,
        error: null,
        status: "Intake complete",
        encounterId: payload.encounterId,
      });
    } catch (error) {
      setSubmission({
        isSubmitted: false,
        pending: false,
        error:
          error instanceof Error ? error.message : "An unexpected error occurred.",
        status: "Submission failed",
        encounterId: null,
      });
    }
  }

  if (!activePatientId) {
    return <PatientCreationForm setPatient={setPatient} />;
  }

  if (submission.isSubmitted) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[color:var(--accent)]/12 p-3 text-[color:var(--accent)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <p className="section-label">Submission Received</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Thank you. The intake has been sent to the clinic.
              </h1>
              <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
                The answers have been structured and added to the practitioner
                dashboard so the doctor can review them before the visit.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "The intake is organized into a clean clinical summary.",
              "SOAP-ready context is prepared for the practitioner view.",
              "The clinic can review the case and follow up from the dashboard.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--muted)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <AppointmentRequestCard
          encounterId={submission.encounterId}
          bookingState={bookingState}
          onSkip={() =>
            setBookingState({
              pending: false,
              error: null,
              submitted: false,
              skipped: true,
            })
          }
          onSubmit={async (values) => {
            if (!submission.encounterId) {
              return;
            }

            setBookingState({
              pending: true,
              error: null,
              submitted: false,
              skipped: false,
            });

            try {
              const response = await fetch(
                `/api/encounters/${submission.encounterId}/appointment-request`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(values),
                },
              );

              const payload = (await response.json()) as { error?: string };

              if (!response.ok) {
                throw new Error(payload.error ?? "Unable to request appointment.");
              }

              setBookingState({
                pending: false,
                error: null,
                submitted: true,
                skipped: false,
              });
            } catch (error) {
              setBookingState({
                pending: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unable to request appointment.",
                submitted: false,
                skipped: false,
              });
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      {patient ? (
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-3">
            <p className="section-label">Unique Patient Link</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {patient.first_name} {patient.last_name} has been created.
            </h1>
            <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
              This demo generated a unique patient link. Share it with the
              patient, or continue through the questionnaire below to walk the
              full flow end to end.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 sm:flex-row sm:items-center">
            <input
              readOnly
              value={patientLink ?? ""}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--foreground)] outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--foreground)] px-4 py-3 text-sm font-semibold text-white"
            >
              {copiedLink ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copiedLink ? "Copied" : "Copy link"}
            </button>
          </div>
        </section>
      ) : (
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-2">
            <p className="section-label">Patient Intake Link</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Complete the patient questionnaire.
            </h1>
            <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
              This link is attached to a patient record. Once the questionnaire
              is submitted, the clinic receives a structured, ready-to-review
              intake summary.
            </p>
          </div>
        </section>
      )}

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <PatientIntakeForm
          patientId={activePatientId}
          onSubmit={submitIntake}
          isSubmitting={submission.pending}
          submissionStatus={submission.status}
          submissionError={submission.error}
        />
      </section>
    </div>
  );
}

function AppointmentRequestCard(props: {
  encounterId: string | null;
  bookingState: BookingState;
  onSkip: () => void;
  onSubmit: (values: AppointmentRequestInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppointmentRequestValues, unknown, AppointmentRequestInput>({
    resolver: zodResolver(appointmentRequestSchema),
    defaultValues: {
      preferred_day: "",
      preferred_time: "",
      notes: "",
    },
  });

  if (props.bookingState.submitted) {
    return (
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-[color:var(--accent)]/12 p-3 text-[color:var(--accent)]">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <p className="section-label">Appointment Requested</p>
            <h2 className="mt-2 text-2xl font-semibold">
              Your booking request has been sent.
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-[color:var(--muted)]">
              The clinic can now see your preferred availability directly inside
              the practitioner dashboard and can reach out to confirm the visit.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (props.bookingState.skipped) {
    return (
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <p className="section-label">Appointment</p>
        <h2 className="mt-2 text-2xl font-semibold">No problem.</h2>
        <p className="mt-3 max-w-3xl leading-7 text-[color:var(--muted)]">
          Your intake has still been sent successfully. You can request an
          appointment later through the clinic if you need one.
        </p>
      </section>
    );
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <div className="space-y-2">
        <p className="section-label">Next Step</p>
        <h2 className="text-2xl font-semibold">Request an appointment if needed</h2>
        <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
          If you would like the clinic to contact you about scheduling, share a
          preferred day and time below.
        </p>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit(props.onSubmit)}>
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Preferred day</span>
          <select
            {...register("preferred_day")}
            className={inputClassName}
            disabled={props.bookingState.pending}
          >
            <option value="">Select a day</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
          </select>
          {errors.preferred_day ? (
            <span className="text-sm text-[color:var(--danger)]">
              {errors.preferred_day.message}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Preferred time</span>
          <select
            {...register("preferred_time")}
            className={inputClassName}
            disabled={props.bookingState.pending}
          >
            <option value="">Select a time window</option>
            <option value="Morning">Morning</option>
            <option value="Midday">Midday</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Late Afternoon">Late Afternoon</option>
          </select>
          {errors.preferred_time ? (
            <span className="text-sm text-[color:var(--danger)]">
              {errors.preferred_time.message}
            </span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Scheduling notes</span>
          <textarea
            {...register("notes")}
            className={`${inputClassName} min-h-28 resize-y`}
            disabled={props.bookingState.pending}
            placeholder="Share anything helpful for scheduling."
          />
          {errors.notes ? (
            <span className="text-sm text-[color:var(--danger)]">
              {errors.notes.message}
            </span>
          ) : null}
        </label>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="submit"
            disabled={props.bookingState.pending || !props.encounterId}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.bookingState.pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Request Appointment
          </button>
          <button
            type="button"
            onClick={props.onSkip}
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--line)] px-4 py-3 text-sm font-semibold"
          >
            Skip for now
          </button>
        </div>

        {props.bookingState.error ? (
          <div className="rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/8 px-4 py-3 text-sm text-[color:var(--danger)]">
            {props.bookingState.error}
          </div>
        ) : null}
      </form>
    </section>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]";
