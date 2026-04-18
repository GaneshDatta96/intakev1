"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  PlusCircle,
  LoaderCircle,
  AlertCircle,
  Copy,
  CheckCircle,
} from "lucide-react";
import { getAllClinics, type ClinicDefinition } from "@/lib/clinics/niche-configs";

const patientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
};

const clinics = getAllClinics();

export default function PatientsPage() {
  const [isPending, startTransition] = useTransition();
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedClinicSlug, setSelectedClinicSlug] = useState<string>(
    clinics[0]?.slug ?? "general-practice",
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
  });

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const selectedClinic =
    clinics.find((clinic) => clinic.slug === selectedClinicSlug) ?? clinics[0];

  const onSubmit = (values: z.infer<typeof patientSchema>) => {
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch("/api/patients/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error("Failed to create patient");
        }

        const newPatient = (await response.json()) as Patient;
        setPatients((current) => [newPatient, ...current]);
        reset();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred",
        );
      }
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="section-label">Patients</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Create patients and copy clinic-specific intake links.
          </h1>
          <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
            Choose the clinic route once, then each new patient link will point
            to that config-driven intake experience.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5 shadow-sm">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[color:var(--foreground)]">
              Clinic Route
            </span>
            <select
              value={selectedClinicSlug}
              onChange={(event) => setSelectedClinicSlug(event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20"
            >
              {clinics.map((clinic) => (
                <option key={clinic.slug} value={clinic.slug}>
                  {clinic.config.label} - /{clinic.slug}
                </option>
              ))}
            </select>
          </label>
          {selectedClinic ? (
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Active demo: <span className="font-semibold">{selectedClinic.clinicName}</span>.{" "}
              {selectedClinic.headline}
            </p>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5 shadow-sm sm:grid-cols-3 sm:items-end"
        >
          <div className="grid gap-1.5">
            <label className="font-medium text-[color:var(--foreground)]">
              First Name
            </label>
            <input {...register("first_name")} className={inputClassName} />
            {errors.first_name ? (
              <p className="text-sm text-[color:var(--danger)]">
                {errors.first_name.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <label className="font-medium text-[color:var(--foreground)]">
              Last Name
            </label>
            <input {...register("last_name")} className={inputClassName} />
            {errors.last_name ? (
              <p className="text-sm text-[color:var(--danger)]">
                {errors.last_name.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <label className="font-medium text-[color:var(--foreground)]">
              Email
            </label>
            <input {...register("email")} className={inputClassName} />
            {errors.email ? (
              <p className="text-sm text-[color:var(--danger)]">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50"
          >
            {isPending ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <PlusCircle className="h-5 w-5" />
            )}
            Create New Patient
          </button>
        </form>

        {error ? (
          <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--danger)]/8 p-4 text-[color:var(--danger)]">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Patient List</h2>
        {patients.length > 0 ? (
          <div className="space-y-3">
            {patients.map((patient) => {
              const intakeLink = `${origin}/${selectedClinicSlug}?patientId=${patient.id}`;
              return (
                <PatientLinkCard
                  key={patient.id}
                  patient={patient}
                  clinic={selectedClinic}
                  intakeLink={intakeLink}
                  copiedId={copiedId}
                  onCopy={copyToClipboard}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border-2 border-dashed border-[color:var(--line)] p-12 text-center">
            <p className="text-lg font-medium text-[color:var(--muted)]">
              No patients have been created yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PatientLinkCard(props: {
  patient: Patient;
  clinic?: ClinicDefinition;
  intakeLink: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="font-semibold text-[color:var(--foreground)]">
          {props.patient.first_name} {props.patient.last_name}
        </p>
        <p className="text-sm text-[color:var(--muted)]">{props.patient.email}</p>
        <p className="mt-1 text-xs font-mono text-[color:var(--muted)]">
          Created: {new Date(props.patient.created_at).toLocaleDateString()}
        </p>
        {props.clinic ? (
          <p className="mt-2 text-sm text-[color:var(--muted-strong)]">
            Route: <span className="font-semibold">/{props.clinic.slug}</span>
          </p>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-2 lg:max-w-xl">
        <input
          type="text"
          readOnly
          value={props.intakeLink}
          className="w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm text-[color:var(--muted-strong)]"
        />
        <button
          onClick={() => props.onCopy(props.intakeLink, props.patient.id)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
        >
          {props.copiedId === props.patient.id ? (
            <CheckCircle className="h-5 w-5 text-[color:var(--accent)]" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
          {props.copiedId === props.patient.id ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

const inputClassName =
  "rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-base outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20";
