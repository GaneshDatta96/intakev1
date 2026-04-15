import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  LayoutPanelLeft,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-5 py-8 sm:px-8 lg:px-12">
      <section className="glass-panel overflow-hidden rounded-[2rem] p-8 sm:p-10">
        <div className="card-grid items-start">
          <div className="space-y-6">
            <p className="section-label">Clinical Intake V1</p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Intake to structured assessment to SOAP in one focused workflow.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
                This build keeps the scope intentionally narrow: capture the intake,
                normalize it, score a few non-diagnostic clinical patterns, and draft
                the Subjective, partial Objective, and Assessment sections for review.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/intake"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold text-[color:var(--background)] transition-transform hover:-translate-y-0.5"
              >
                Open Intake Flow
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] transition-transform hover:-translate-y-0.5"
              >
                View Dashboard
              </Link>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-6">
            <p className="section-label">V1 Boundaries</p>
            <div className="mt-4 space-y-4 text-sm text-[color:var(--muted)]">
              <div className="rounded-2xl border border-[color:var(--line)] p-4">
                <div className="font-semibold text-[color:var(--foreground)]">
                  In scope
                </div>
                <p className="mt-2">
                  Intake form, JSON normalizer, rule-based pattern scoring, AI SOAP
                  drafting, and manual plan editing.
                </p>
              </div>
              <div className="rounded-2xl border border-[color:var(--line)] p-4">
                <div className="font-semibold text-[color:var(--foreground)]">
                  Out of scope
                </div>
                <p className="mt-2">
                  Full EHR features, large knowledge bases, medication logic, and
                  fully autonomous plans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          {
            icon: ClipboardList,
            title: "Structured intake",
            body: "Six-step flow covering demographics, chief complaint, symptoms, history, lifestyle, and goals.",
          },
          {
            icon: ShieldCheck,
            title: "Deterministic assessment",
            body: "A small pattern library scores matched symptoms, context factors, evidence, and data gaps before the model writes.",
          },
          {
            icon: LayoutPanelLeft,
            title: "Practitioner review",
            body: "Dashboard keeps the patient list on the left and the SOAP workspace on the right with manual plan editing.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="glass-panel rounded-[1.5rem] p-6 transition-transform hover:-translate-y-1"
            >
              <Icon className="h-5 w-5 text-[color:var(--accent)]" />
              <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 leading-7 text-[color:var(--muted)]">{item.body}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
