"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { PatientIntakeForm } from "@/components/intake/patient-intake-form";
import { appointmentRequestSchema, type AppointmentRequestInput, type AppointmentRequestValues } from "@/lib/schemas/intake";
import { subjectiveNoteSchema, type SubjectiveNote } from "@/lib/schemas/modern-soap";

type SubmissionState = {
  isSubmitted: boolean;
  pending: boolean;
  error: string | null;
  status: string;
  encounterId: string | null;
};

import { PatientCreationForm, type PatientDetails } from "./patient-creation-form";

// ... (imports)

export function PatientIntakeExperience() {
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  // ... (existing state)

  if (!patient) {
    return <PatientCreationForm setPatient={setPatient} />;
  }

  // ... (existing logic)

  return (
    // ... (existing JSX)
        <PatientIntakeForm
          patientId={patient.id}
          // ... (rest of the props)
        />
    // ... (existing JSX)
  );
}

function AppointmentRequestCard(props: {
  encounterId: string | null;
  bookingState: {
    pending: boolean;
    error: string | null;
    submitted: boolean;
    skipped: boolean;
  };
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
