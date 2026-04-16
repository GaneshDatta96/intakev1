"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

const patientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

export type PatientDetails = z.infer<typeof patientSchema> & { id: string };

export function PatientCreationForm({ setPatient }: { setPatient: (patient: PatientDetails) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (values: z.infer<typeof patientSchema>) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/patients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create patient.");
      }
      setPatient({ ...values, id: data.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-2">
          <p className="section-label">New Patient</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Create a Patient Record
          </h1>
          <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
            First, let&apos;s create a patient record to associate with this intake.
          </p>
        </div>
      </section>
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
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Create Patient"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
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
