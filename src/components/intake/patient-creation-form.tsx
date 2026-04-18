"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";
import { type ClinicDefinition } from "@/lib/clinics/niche-configs";

const patientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

export type PatientDetails = z.infer<typeof patientSchema> & { id: string };

export function PatientCreationForm(props: {
  clinic: ClinicDefinition;
  embedded?: boolean;
  setPatient: (patient: PatientDetails) => void;
  showOverview?: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showOverview = props.showOverview ?? !props.embedded;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (values: z.infer<typeof patientSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/patients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          clinic_id: props.clinic.id,
          clinic_slug: props.clinic.slug,
        }),
      });
      const data = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !data.id) {
        throw new Error(data.error || "Failed to create patient.");
      }

      props.setPatient({ ...values, id: data.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }

    setIsSubmitting(false);
  };

  return (
    <div
      className={
        props.embedded
          ? "flex w-full flex-col gap-6"
          : "mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12"
      }
    >
      {showOverview ? (
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-2">
            <p className="section-label">{props.clinic.clinicName}</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Create a Patient Record
            </h1>
            <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
              First, let&apos;s create a patient record for this{" "}
              {props.clinic.config.label.toLowerCase()} intake flow.
            </p>
          </div>
        </section>
      ) : null}

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="First Name" error={errors.first_name?.message}>
            <input {...register("first_name")} className={inputClassName} />
          </Field>
          <Field label="Last Name" error={errors.last_name?.message}>
            <input {...register("last_name")} className={inputClassName} />
          </Field>
          <Field label="Email Address" error={errors.email?.message}>
            <input {...register("email")} className={inputClassName} />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              "Create Patient"
            )}
          </button>

          {error ? (
            <p className="text-sm text-[color:var(--danger)]">{error}</p>
          ) : null}
        </form>
      </section>
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
      <span className="font-medium text-[color:var(--foreground)]">{props.label}</span>
      {props.children}
      {props.error ? (
        <span className="text-sm text-[color:var(--danger)]">{props.error}</span>
      ) : null}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20";
