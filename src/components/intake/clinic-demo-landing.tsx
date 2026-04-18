"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileText,
  LayoutDashboard,
  Stethoscope,
  Users,
} from "lucide-react";
import { type ClinicDefinition } from "@/lib/clinics/niche-configs";
import { getClinicPersonalization } from "@/lib/clinics/personalization";
import {
  PatientCreationForm,
  type PatientDetails,
} from "./patient-creation-form";

const liveDemoSteps = [
  "You create a patient.",
  "The system generates a private intake link.",
  "The patient completes it before the visit.",
  "You get a structured, SOAP-ready view instantly.",
];

const beforePoints = [
  "Chasing incomplete intake forms",
  "Reading messy PDFs",
  "Starting consults with missing context",
];

const afterPoints = [
  "Structured patient data",
  "Clear timelines",
  "Ready-to-review context",
];

const outcomeCards = [
  {
    title: "Less admin",
    description: "No back-and-forth before consults.",
  },
  {
    title: "Better intake quality",
    description: "Patients provide usable, structured data.",
  },
  {
    title: "Faster consultations",
    description: "You start informed, not from scratch.",
  },
];

export function ClinicDemoLanding(props: {
  clinic: ClinicDefinition;
  setPatient: (patient: PatientDetails) => void;
}) {
  const personalization = getClinicPersonalization(props.clinic);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      <section className="glass-panel rounded-[2.25rem] px-6 py-8 shadow-[0_24px_90px_rgba(27,44,52,0.14)] sm:px-8 sm:py-10 lg:px-10">
        <div className="max-w-4xl">
          <p className="section-label">Built For {props.clinic.clinicName}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
            A custom intake &amp; consultation flow built for{" "}
            {props.clinic.clinicName}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted-strong)]">
            We put together a working version of how your clinic could handle
            patient intake, pre-consult data, and SOAP-ready documentation
            before the visit even starts.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#patient-flow"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92"
          >
            View how your patients would experience it
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#team-output"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-white"
          >
            View how your team would use it
            <LayoutDashboard className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8">
          <p className="section-label">Clinic Context</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)] sm:text-4xl">
            This already feels like {props.clinic.clinicName}.
          </h2>
          <p className="mt-5 max-w-3xl leading-8 text-[color:var(--muted-strong)]">
            {personalization.contextSentence}
          </p>
          <p className="mt-4 max-w-3xl leading-8 text-[color:var(--muted)]">
            This demo is structured around that, so the intake, questions, and
            outputs reflect how your consultations likely run.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--foreground)] px-6 py-8 text-white shadow-[0_20px_70px_rgba(20,33,37,0.16)] sm:px-8">
          <p className="section-label !text-white/60">Why This Matters</p>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
            Better first 10 minutes of every consultation.
          </p>
          <p className="mt-4 leading-7 text-white/78">
            {personalization.workflowAngle}
          </p>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8">
        <div className="max-w-3xl">
          <p className="section-label">Live Demo</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)] sm:text-4xl">
            This isn&apos;t a concept.
          </h2>
          <p className="mt-4 leading-8 text-[color:var(--muted-strong)]">
            This is a working flow built for your clinic:
          </p>
        </div>

        <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {liveDemoSteps.map((step, index) => (
            <li
              key={step}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 px-5 py-5"
            >
              <p className="font-mono text-sm text-[color:var(--muted)]">
                Step 0{index + 1}
              </p>
              <p className="mt-4 text-base leading-7 text-[color:var(--foreground)]">
                {step}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#patient-flow"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92"
          >
            <Users className="h-4 w-4" />
            See the patient side
          </a>
          <a
            href="#team-output"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-white"
          >
            <Stethoscope className="h-4 w-4" />
            See your practitioner view
          </a>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8">
          <p className="section-label">Instead Of</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Friction before every consult.
          </h2>
          <div className="mt-6 space-y-3">
            {beforePoints.map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-[color:var(--line)] bg-white/78 px-4 py-4 text-base leading-7 text-[color:var(--foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8">
          <p className="section-label">You Start With</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Review-ready context before the visit.
          </h2>
          <div className="mt-6 space-y-3">
            {afterPoints.map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-[color:var(--line)] bg-white/78 px-4 py-4 text-base leading-7 text-[color:var(--foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {outcomeCards.map((card) => (
          <div
            key={card.title}
            className="glass-panel rounded-[1.75rem] px-6 py-7"
          >
            <p className="section-label">For {props.clinic.clinicName}</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
              {card.title}
            </h2>
            <p className="mt-3 leading-7 text-[color:var(--muted-strong)]">
              {card.description}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-6 py-8 shadow-[0_20px_70px_rgba(27,44,52,0.08)] sm:px-8 sm:py-10">
        <p className="section-label">Personalized Angle</p>
        <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          For clinics like {props.clinic.clinicName}, especially in{" "}
          {personalization.services}, intake quality directly impacts how
          effective the consultation is.
        </h2>
        <p className="mt-5 max-w-4xl leading-8 text-[color:var(--muted-strong)]">
          This demo is designed around that exact workflow, so it feels less
          like software and more like your team&apos;s process already running.
        </p>
      </section>

      <section
        id="team-output"
        className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <p className="section-label">Practitioner View</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Structured output built around your review flow.
            </h2>
            <p className="mt-5 max-w-3xl leading-8 text-[color:var(--muted-strong)]">
              When patients submit their intake, your team starts with a clean,
              structured, SOAP-ready view instead of raw answers and scattered
              context.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-[color:var(--muted-strong)]">
              {afterPoints.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-2"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewCard
              label="S"
              title="Subjective"
              items={props.clinic.config.soap.S}
            />
            <PreviewCard
              label="O"
              title="Objective"
              items={props.clinic.config.soap.O}
            />
            <PreviewCard
              label="A"
              title="Assessment"
              items={props.clinic.config.soap.A}
            />
            <PreviewCard
              label="P"
              title="Plan"
              items={props.clinic.config.soap.P}
              fallback="Left manual for your team to finalize."
            />
          </div>
        </div>
      </section>

      <section
        id="patient-flow"
        className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10"
      >
        <div className="max-w-3xl">
          <p className="section-label">Patient Side</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            See how your patient flow would actually start.
          </h2>
          <p className="mt-5 leading-8 text-[color:var(--muted-strong)]">
            Create a sample patient, generate the private intake link, and walk
            through the exact flow your clinic could use.
          </p>
        </div>

        <div className="mt-8">
          <PatientCreationForm
            clinic={props.clinic}
            embedded
            setPatient={props.setPatient}
            showOverview={false}
          />
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-6 py-8 text-center sm:px-8 sm:py-10">
        <p className="section-label">Next Step</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          This is just a demo version.
        </h2>
        <p className="mx-auto mt-5 max-w-3xl leading-8 text-[color:var(--muted-strong)]">
          We can build this tailored to how {props.clinic.clinicName} actually
          operates, including your intake logic, review flow, and documentation
          style.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
          If this feels useful, happy to walk you through it.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="https://cal.com/ganesh-datta-bygktk/sales-throughput-session"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92"
          >
            Book a walkthrough
          </Link>
          <Link
            href="https://cal.com/ganesh-datta-bygktk/sales-throughput-session"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-white"
          >
            Request your version
          </Link>
        </div>
        <p className="mt-6 text-sm font-semibold tracking-[-0.01em] text-[color:var(--muted)]">
          {personalization.signatureLine}
        </p>
      </section>
    </div>
  );
}

function PreviewCard(props: {
  label: string;
  title: string;
  items: string[];
  fallback?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-mono text-sm text-[color:var(--muted)]">{props.label}</p>
        <FileText className="h-4 w-4 text-[color:var(--muted)]" />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">
        {props.title}
      </h3>
      <div className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--muted-strong)]">
        {props.items.length > 0 ? (
          props.items.map((item) => (
            <p
              key={item}
              className="rounded-2xl bg-[color:var(--surface-strong)] px-3 py-2"
            >
              {item}
            </p>
          ))
        ) : (
          <p className="rounded-2xl bg-[color:var(--surface-strong)] px-3 py-2">
            {props.fallback ?? "Handled by your team during review."}
          </p>
        )}
      </div>
    </div>
  );
}
