"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Copy, FileJson } from "lucide-react";
import { type DashboardCase } from "@/lib/dashboard/dashboard-data";

export function DashboardShell({ cases }: { cases: DashboardCase[] }) {
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [planDrafts, setPlanDrafts] = useState<Record<string, string>>(
    Object.fromEntries(cases.map((item) => [item.id, item.soap.plan_draft])),
  );

  if (cases.length === 0) {
    return (
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <p className="section-label">No Patients Yet</p>
        <h2 className="mt-2 text-2xl font-semibold">
          The dashboard will populate as soon as patients complete the intake.
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-[color:var(--muted)]">
          Share the public intake link with patients, and each completed intake
          will appear here as a structured encounter ready for SOAP review.
        </p>
        <div className="mt-6">
          <Link
            href="/intake"
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold text-[color:var(--background)]"
          >
            Open Patient Intake Link
          </Link>
        </div>
      </section>
    );
  }

  const activeCase = cases.find((item) => item.id === selectedId) ?? cases[0];
  const activePlanDraft = planDrafts[activeCase.id] ?? activeCase.soap.plan_draft;

  function handleCopy() {
    if (copied) {
      return;
    }

    const payload = {
      ...activeCase,
      soap: {
        ...activeCase.soap,
        plan_draft: activePlanDraft,
      },
    };

    window.navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card-grid">
      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Patients</p>
            <h2 className="mt-2 text-2xl font-semibold">Submitted encounters</h2>
          </div>
          <div className="rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-mono text-[color:var(--muted)]">
            {cases.length} total
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {cases.map((item) => {
            const isActive = selectedId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${isActive ? "border-transparent bg-[color:var(--accent)] text-white" : "border-[color:var(--line)] bg-[color:var(--surface-strong)]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {item.patient.first_name} {item.patient.last_name}
                    </div>
                    <p
                      className={`mt-2 text-sm leading-6 ${isActive ? "text-white/80" : "text-[color:var(--muted)]"}`}
                    >
                      {item.chief_complaint}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs">
                      {new Date(item.submitted_at).toLocaleDateString()}
                    </div>
                    {item.appointment_request ? (
                      <div
                        className={`mt-2 rounded-full px-2 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${isActive ? "bg-white/16 text-white" : "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"}`}
                      >
                        Appointment
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">Structured SOAP View</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {activeCase.patient.first_name} {activeCase.patient.last_name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Submitted {new Date(activeCase.submitted_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-2.5 transition-colors hover:bg-[color:var(--surface-raised)]"
            >
              {copied ? (
                <CheckCircle2 className="h-5 w-5 text-[color:var(--accent)]" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SummaryCard
            title="Patient"
            body={`${activeCase.patient.first_name} ${activeCase.patient.last_name}\n${activeCase.patient.contact.phone || "No phone provided"}\n${activeCase.patient.contact.email || "No email provided"}`}
          />
          <SummaryCard
            title="Encounter"
            body={`Status: ${formatStatus(activeCase.encounter_status)}\nSOAP: ${formatStatus(activeCase.soap_review_status)}\nComplaint: ${activeCase.chief_complaint}`}
          />
        </div>

        {activeCase.appointment_request ? (
          <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[color:var(--accent)]/12 p-2 text-[color:var(--accent)]">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <p className="section-label">Appointment Request</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                  {activeCase.appointment_request.preferred_day},{" "}
                  {activeCase.appointment_request.preferred_time}
                </p>
              </div>
            </div>
            {activeCase.appointment_request.notes ? (
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                {activeCase.appointment_request.notes}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 space-y-6">
          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="section-label">Assessment</p>
            <div className="mt-4 space-y-3">
              {activeCase.assessment.results.map((result) => (
                <div
                  key={`${activeCase.id}-${result.pattern_key}-${result.rank}`}
                  className="rounded-2xl border border-[color:var(--line)] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold">{result.label}</div>
                    <div className="font-mono text-sm text-[color:var(--muted)]">
                      {result.confidence.toFixed(2)}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {result.evidence.join(" ")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="section-label">SOAP Draft</p>
            <div className="mt-4 space-y-4 text-sm leading-7">
              <SoapSection title="Subjective" body={activeCase.soap.subjective} />
              <SoapSection title="Objective" body={activeCase.soap.objective} />
              <SoapSection title="Assessment" body={activeCase.soap.assessment} />
              <label className="grid gap-2">
                <span className="font-semibold">Plan Draft</span>
                <textarea
                  value={activePlanDraft}
                  onChange={(event) =>
                    setPlanDrafts((current) => ({
                      ...current,
                      [activeCase.id]: event.target.value,
                    }))
                  }
                  className="min-h-40 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--background)]/50 px-4 py-3 text-[color:var(--muted)] outline-none transition focus:border-[color:var(--accent)]"
                />
              </label>
            </div>
          </div>

          <details className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <summary className="flex cursor-pointer items-center gap-2 font-semibold">
              <FileJson className="h-4 w-4" />
              Expand normalized intake JSON
            </summary>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#132025] p-4 text-xs leading-6 text-[#d9f3ef]">
              {JSON.stringify(activeCase.normalized_intake, null, 2)}
            </pre>
          </details>

          {activeCase.source === "demo" ? (
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              Showing demo encounter data because no Supabase connection is configured
              for the dashboard runtime yet.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryCard(props: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
      <p className="section-label">{props.title}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[color:var(--muted)]">
        {props.body}
      </p>
    </div>
  );
}

function SoapSection(props: { title: string; body: string }) {
  return (
    <section>
      <h3 className="font-semibold">{props.title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-[color:var(--muted)]">
        {props.body}
      </p>
    </section>
  );
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}
