"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, ExternalLink, LoaderCircle } from "lucide-react";

const createDemoSchema = z.object({
  name: z.string().trim().min(2, "Clinic name is required."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  niche: z.string().trim().min(1, "Choose a niche."),
  location: z.string().trim().default(""),
  country: z.string().trim().default("United States"),
  website: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value),
      {
        message: "Enter a full website URL or leave it blank.",
      },
    ),
  description: z.string().trim().default(""),
  approach: z.string().trim().default(""),
});

type CreateDemoValues = z.infer<typeof createDemoSchema>;

type DemoClinicResponse = {
  clinic: {
    id?: string;
    slug: string;
    clinicName: string;
    niche: string;
    label: string;
  };
  persisted: boolean;
};

export function CreateDemoForm(props: {
  nicheOptions: Array<{
    niche: string;
    label: string;
  }>;
}) {
  type FormInput = z.input<typeof createDemoSchema>;
  const [result, setResult] = useState<DemoClinicResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, CreateDemoValues>({
    resolver: zodResolver(createDemoSchema),
    defaultValues: {
      name: "",
      slug: "",
      niche: props.nicheOptions[0]?.niche ?? "",
      location: "",
      country: "United States",
      website: "",
      description: "",
      approach: "",
    },
  });

  const onSubmit = async (values: CreateDemoValues) => {
    setRequestError(null);
    setResult(null);

    const response = await fetch("/api/clinics/create-demo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as {
      error?: string;
      clinic?: DemoClinicResponse["clinic"];
      persisted?: boolean;
    };

    if (!response.ok || !payload.clinic) {
      setRequestError(payload.error ?? "Unable to create demo clinic.");
      return;
    }

    setResult({
      clinic: payload.clinic,
      persisted: payload.persisted ?? false,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="space-y-3">
          <p className="section-label">Create Demo</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Spin up a new clinic demo route.
          </h1>
          <p className="max-w-4xl leading-7 text-[color:var(--muted)]">
            This creates a demo clinic row in Supabase, ties it to a niche, and
            gives you a shareable{" "}
            <code className="rounded bg-white/70 px-2 py-1 text-sm">/&lt;slug&gt;</code>{" "}
            route that loads the correct intake config, SOAP structure, and
            personalized clinic-facing sales page.
          </p>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Clinic Name" error={errors.name?.message}>
              <input {...register("name")} className={inputClassName} />
            </Field>
            <Field label="Route Slug" error={errors.slug?.message}>
              <input
                {...register("slug")}
                className={inputClassName}
                placeholder="newlookskincenter"
              />
            </Field>
            <Field label="Niche" error={errors.niche?.message}>
              <select {...register("niche")} className={inputClassName}>
                {props.nicheOptions.map((option) => (
                  <option key={option.niche} value={option.niche}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location" error={errors.location?.message}>
              <input
                {...register("location")}
                className={inputClassName}
                placeholder="New York, NY"
              />
            </Field>
            <Field label="Country" error={errors.country?.message}>
              <input {...register("country")} className={inputClassName} />
            </Field>
            <Field label="Website" error={errors.website?.message}>
              <input
                {...register("website")}
                className={inputClassName}
                placeholder="https://example.com"
              />
            </Field>
          </div>

          <Field label="Clinic Focus / Services" error={errors.description?.message}>
            <textarea
              {...register("description")}
              className={`${inputClassName} min-h-28 resize-y`}
              placeholder="Botox, fillers, laser, and advanced skin treatments."
            />
          </Field>

          <Field label="Consultation Style / Review Flow" error={errors.approach?.message}>
            <textarea
              {...register("approach")}
              className={`${inputClassName} min-h-28 resize-y`}
              placeholder="Consultations usually need treatment history, expectations, and suitability review before the visit."
            />
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : null}
              Create Demo Route
            </button>
            <p className="text-sm text-[color:var(--muted)]">
              The slug becomes the public-facing demo URL, and the focus fields
              drive the personalized sales copy on that route.
            </p>
          </div>

          {requestError ? (
            <div className="rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/8 px-4 py-3 text-sm text-[color:var(--danger)]">
              {requestError}
            </div>
          ) : null}
        </form>
      </section>

      {result ? (
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-[color:var(--accent)]/12 p-3 text-[color:var(--accent)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <p className="section-label">Demo Ready</p>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {result.clinic.clinicName} has a live demo route.
              </h2>
              <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
                Niche: {result.clinic.label}. Route:{" "}
                <span className="font-mono">/{result.clinic.slug}</span>.{" "}
                {result.persisted
                  ? "Saved to Supabase."
                  : "Generated locally because Supabase is not configured."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link
              href={`/${result.clinic.slug}`}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="section-label">Demo Route</p>
                <ExternalLink className="h-4 w-4 text-[color:var(--muted)]" />
              </div>
              <p className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">
                /{result.clinic.slug}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Open the public clinic demo experience.
              </p>
            </Link>

            <Link
              href="/intake"
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="section-label">Directory</p>
                <ExternalLink className="h-4 w-4 text-[color:var(--muted)]" />
              </div>
              <p className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">
                View Clinic Demos
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Return to the demo directory and open any route from there.
              </p>
            </Link>
          </div>
        </section>
      ) : null}
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
      <span className="font-medium text-[color:var(--foreground)]">
        {props.label}
      </span>
      {props.children}
      {props.error ? (
        <span className="text-sm text-[color:var(--danger)]">{props.error}</span>
      ) : null}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20";
