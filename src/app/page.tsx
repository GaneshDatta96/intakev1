import type { Metadata } from "next";
import Link from "next/link";

const heroSteps = [
  "Doctor creates the patient.",
  "System generates a unique patient link.",
  "Patient completes the questionnaire.",
  "Doctor reviews structured, SOAP-ready intake.",
];

const flowSteps = [
  "Create a patient record and generate a unique intake link.",
  "Send the link so the patient completes intake before the visit.",
  "The system structures the answers into organized clinical data.",
  "Review a clean practitioner view with SOAP-ready context.",
];

const benefits = [
  {
    title: "Less admin",
    description: "Fewer calls, fewer PDFs, and less manual re-entry.",
  },
  {
    title: "Better intake quality",
    description: "Answers arrive complete, legible, and consistently structured.",
  },
  {
    title: "Faster documentation",
    description: "Clinicians start with organized context instead of a blank note.",
  },
];

export const metadata: Metadata = {
  title: "Custom Patient Intake Workflow Demo",
  description:
    "Create a patient, generate a unique patient link, collect intake responses, and review structured SOAP-ready data in a custom clinic workflow demo.",
};

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-8 px-5 pb-20 pt-8 sm:px-8 sm:pt-12 lg:px-12">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
          <p className="section-label">Custom Clinic Intake Demo</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-[3.75rem] lg:leading-[1.02]">
            Create a patient, send a unique intake link, and review
            structured SOAP-ready intake.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted-strong)]">
            The doctor creates the patient, the system generates a unique
            patient link, the patient completes the questionnaire, and the
            answers return as organized clinical data.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
            This is a live demo of a custom-built patient intake and
            practitioner workflow system for clinics, not a SaaS product.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/intake"
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92"
            >
              View Patient Experience
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-white"
            >
              View Practitioner Dashboard
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-[color:var(--muted-strong)]">
            <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-2">
              Less admin
            </span>
            <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-2">
              Better intake quality
            </span>
            <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-2">
              Faster documentation
            </span>
          </div>
        </div>

        <div className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
          <p className="section-label">Workflow At A Glance</p>
          <div className="mt-6 space-y-4">
            {heroSteps.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 px-4 py-4"
              >
                <span className="font-mono text-sm text-[color:var(--muted)]">
                  0{index + 1}
                </span>
                <p className="text-base font-semibold tracking-[-0.02em] text-[color:var(--foreground)]">
                  {step}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-raised)] px-5 py-5">
            <p className="section-label">Doctor Output</p>
            <p className="mt-3 text-xl font-semibold tracking-[-0.03em]">
              Clean patient context, ready for review and SOAP drafting.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-6 py-8 shadow-[0_20px_70px_rgba(27,44,52,0.08)] sm:px-8 sm:py-10">
        <div className="max-w-3xl">
          <p className="section-label">How It Works</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Four steps from patient creation to practitioner-ready review.
          </h2>
        </div>
        <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {flowSteps.map((step, index) => (
            <li
              key={step}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/78 px-5 py-5"
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
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="glass-panel rounded-[1.75rem] px-6 py-7"
          >
            <p className="section-label">Outcome</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
              {benefit.title}
            </h2>
            <p className="mt-3 leading-7 text-[color:var(--muted-strong)]">
              {benefit.description}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
        <div className="glass-panel rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
          <p className="section-label">Built For Your Clinic</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            This demo shows the kind of workflow we can build for your practice.
          </h2>
          <p className="mt-5 max-w-3xl leading-8 text-[color:var(--muted-strong)]">
            The patient link, intake questions, data structure, and
            practitioner view can all be tailored to your specialty, review
            process, and documentation style.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--foreground)] px-6 py-8 text-white shadow-[0_20px_70px_rgba(20,33,37,0.16)] sm:px-8 sm:py-10">
          <p className="section-label !text-white/60">Why It Matters</p>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
            Intake becomes easier to send, easier to complete, and easier to
            use.
          </p>
          <p className="mt-4 leading-7 text-white/78">
            The result is less friction before the visit and a better starting
            point for clinical review.
          </p>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] px-6 py-8 text-center sm:px-8 sm:py-10">
        <p className="section-label">Next Step</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          If this flow fits your clinic, we can build your version.
        </h2>
        <p className="mx-auto mt-5 max-w-3xl leading-8 text-[color:var(--muted-strong)]">
          We tailor the intake flow, structured outputs, and practitioner
          workspace to match how your team actually works.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92"
          >
            Book a walkthrough
          </Link>
          <Link
            href="#"
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-white"
          >
            Request custom version
          </Link>
        </div>
      </section>
    </div>
  );
}
