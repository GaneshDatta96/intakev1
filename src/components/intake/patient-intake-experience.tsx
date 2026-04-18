"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  LoaderCircle,
  Send,
} from "lucide-react";
import { PatientIntakeForm } from "@/components/intake/patient-intake-form";
import { type ClinicDefinition } from "@/lib/clinics/niche-configs";
import {
  appointmentRequestSchema,
  type AppointmentRequestInput,
  type AppointmentRequestValues,
} from "@/lib/schemas/intake";
import { type NicheIntakePayload } from "@/lib/schemas/niche-intake";
import { type SoapDraft } from "@/lib/schemas/soap";
import { ClinicDemoLanding } from "./clinic-demo-landing";
import { type PatientDetails } from "./patient-creation-form";

type SubmissionState = {
  isSubmitted: boolean;
  pending: boolean;
  error: string | null;
  status: string;
  encounterId: string | null;
  bookingEnabled: boolean;
  soap: SoapDraft | null;
};

type BookingState = {
  pending: boolean;
  error: string | null;
  submitted: boolean;
  skipped: boolean;
};

export function PatientIntakeExperience(props: {
  initialPatientId?: string | null;
  clinic: ClinicDefinition;
}) {
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [origin, setOrigin] = useState("");
  const [submission, setSubmission] = useState<SubmissionState>({
    isSubmitted: false,
    pending: false,
    error: null,
    status: `Complete the ${props.clinic.config.label.toLowerCase()} questionnaire to prepare the intake.`,
    encounterId: null,
    bookingEnabled: false,
    soap: null,
  });
  const [bookingState, setBookingState] = useState<BookingState>({
    pending: false,
    error: null,
    submitted: false,
    skipped: false,
  });

  const activePatientId = patient?.id ?? props.initialPatientId ?? null;
  const patientPath = activePatientId
    ? `/${props.clinic.slug}?patientId=${activePatientId}`
    : null;
  const patientLink = patientPath ? `${origin}${patientPath}` : null;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function handleCopyLink() {
    if (!patientPath || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    const absoluteLink = new URL(patientPath, window.location.origin).toString();
    await navigator.clipboard.writeText(absoluteLink);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  }

  async function submitIntake(values: NicheIntakePayload) {
    setSubmission({
      isSubmitted: false,
      pending: true,
      error: null,
      status: "Saving intake and preparing the clinic-ready SOAP preview...",
      encounterId: null,
      bookingEnabled: false,
      soap: null,
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
        bookingEnabled?: boolean;
        soap?: SoapDraft;
      };

      if (!response.ok || !payload.soap) {
        throw new Error(payload.error ?? "Submission failed.");
      }

      setSubmission({
        isSubmitted: true,
        pending: false,
        error: null,
        status: "Intake complete",
        encounterId: payload.encounterId ?? null,
        bookingEnabled: payload.bookingEnabled ?? false,
        soap: payload.soap,
      });
    } catch (error) {
      setSubmission({
        isSubmitted: false,
        pending: false,
        error:
          error instanceof Error ? error.message : "An unexpected error occurred.",
        status: "Submission failed",
        encounterId: null,
        bookingEnabled: false,
        soap: null,
      });
    }
  }

  if (!activePatientId) {
    return <ClinicDemoLanding clinic={props.clinic} setPatient={setPatient} />;
  }

  if (submission.isSubmitted) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[color:var(--accent)]/12 p-3 text-[color:var(--accent)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <p className="section-label">Submission Received</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {props.clinic.config.label} intake sent to the clinic.
              </h1>
              <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
                The responses have been structured into a niche-aware SOAP draft
                so the practitioner can review stronger Subjective and
                Assessment context before the visit.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "Questions were rendered from the selected niche config.",
              "The SOAP draft used the clinic's configured S, O, and A focus areas.",
              "The Plan remains intentionally manual for practitioner review.",
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

        {submission.soap ? (
          <SoapPreviewCard clinic={props.clinic} soap={submission.soap} />
        ) : null}

        {submission.bookingEnabled ? (
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
        ) : (
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <p className="section-label">Appointment</p>
            <h2 className="mt-2 text-2xl font-semibold">
              Demo intake saved without scheduling.
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-[color:var(--muted)]">
              This clinic is currently using the newer demo persistence flow, so
              appointment requests are left out of the route for now.
            </p>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-3">
          <p className="section-label">{props.clinic.clinicName}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {props.clinic.config.label} intake experience
          </h1>
          <p className="max-w-4xl leading-7 text-[color:var(--muted)]">
            {props.clinic.headline} This route is driven by the same niche
            config used to render the form and assemble the SOAP preview.
          </p>
        </div>
      </section>

      {patient ? (
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-3">
            <p className="section-label">Unique Patient Link</p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {patient.first_name} {patient.last_name} has been created.
            </h2>
            <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
              Share the clinic-specific link below, or continue through the
              questionnaire here to walk the full flow end to end.
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
      ) : null}

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <PatientIntakeForm
          patientId={activePatientId}
          clinic={props.clinic}
          onSubmit={submitIntake}
          isSubmitting={submission.pending}
          submissionStatus={submission.status}
          submissionError={submission.error}
        />
      </section>
    </div>
  );
}

function SoapPreviewCard(props: {
  clinic: ClinicDefinition;
  soap: SoapDraft;
}) {
  const sections = [
    {
      key: "S",
      title: "Subjective",
      items: props.clinic.config.soap.S,
      content: props.soap.subjective,
    },
    {
      key: "O",
      title: "Objective",
      items: props.clinic.config.soap.O,
      content: props.soap.objective,
    },
    {
      key: "A",
      title: "Assessment",
      items: props.clinic.config.soap.A,
      content: props.soap.assessment,
    },
    {
      key: "P",
      title: "Plan",
      items: props.clinic.config.soap.P,
      content: props.soap.plan_draft,
    },
  ];

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <div className="space-y-2">
        <p className="section-label">SOAP Preview</p>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Config-driven SOAP output for {props.clinic.config.label}
        </h2>
        <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
          The draft below is rendered using the clinic&apos;s configured SOAP
          structure. Practitioners can review and edit it before finalizing the
          note.
        </p>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.key}
            className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-sm font-semibold text-[color:var(--accent)]">
                {section.key}
              </span>
              <h3 className="text-xl font-semibold text-[color:var(--foreground)]">
                {section.title}
              </h3>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {section.items.length > 0 ? (
                section.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)]"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-strong)]">
                  Manual clinician section
                </span>
              )}
            </div>

            <pre className="mt-5 whitespace-pre-wrap rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 font-sans text-sm leading-7 text-[color:var(--foreground)]">
              {section.content}
            </pre>
          </article>
        ))}
      </div>
    </section>
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
