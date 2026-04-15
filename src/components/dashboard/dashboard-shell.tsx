"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileJson,
  UserRound,
} from "lucide-react";
import { type DashboardCase } from "@/lib/dashboard/dashboard-data";

export function DashboardShell({ cases }: { cases: DashboardCase[] }) {
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");

  if (cases.length === 0) {
    return (
      <section className="rounded-[2rem] border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] p-6 shadow-[0_20px_70px_rgba(27,44,52,0.12)] sm:p-8">
        <p className="section-label">No Submitted Encounters</p>
        <h2 className="mt-2 text-2xl font-semibold">
          The patient list will fill up as patients complete the intake.
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-[color:var(--muted)]">
          Share the patient intake link and each submission will show up here.
        </p>
        <div className="mt-6">
          <Link
            href="/questionnaire"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-semibold text-[color:var(--background)]"
          >
            Open Patient Intake Form
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  const activeCase = cases.find((item) => item.id === selectedId) ?? cases[0];

  return (
    <div className="flex h-full flex-1 gap-5">
      <aside className="w-96 rounded-[2rem] border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] p-4 shadow-lg">
        <div className="flex h-full flex-col">
            <p className="section-label px-2">Patient Encounters</p>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
              {cases.map((item) => {
                const isActive = selectedId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition-all ${isActive ? "border-transparent bg-[#183137] text-white shadow-md" : "border-[color:var(--line)] bg-[color:var(--surface-raised)] hover:border-[color:var(--line-strong)]"}`}>
                      <p className="truncate text-sm font-semibold">
                        {item.patient.first_name} {item.patient.last_name}
                      </p>
                      <p className={`mt-2 text-sm leading-6 ${isActive ? "text-white/78" : "text-[color:var(--muted)]"}`}>
                        {item.chief_complaint}
                      </p>
                      <p className="mt-3 font-mono text-[11px] uppercase tracking-wider opacity-70">
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </p>
                  </button>
                );
              })}
            </div>
        </div>
      </aside>
      <main className="flex-1 rounded-[2rem] border border-[color:var(--line-strong)] bg-[color:var(--surface-strong)] p-6 shadow-lg">
        <PatientDetail case={activeCase} />
      </main>
    </div>
  );
}

function PatientDetail({ case: activeCase }: { case: DashboardCase }) {
    const [planDraft, setPlanDraft] = useState(activeCase.soap.plan_draft);
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        if (copied) return;
        window.navigator.clipboard.writeText(JSON.stringify(activeCase, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="space-y-8">
            <header className="flex items-start justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{activeCase.patient.first_name} {activeCase.patient.last_name}</h2>
                    <p className="mt-2 text-lg text-gray-600">{activeCase.chief_complaint}</p>
                    <p className="mt-2 font-mono text-xs uppercase text-gray-400">{new Date(activeCase.submitted_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="rounded-full p-3 border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                  {copied ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-gray-500" />}
                </button>
            </header>

            <div className="space-y-10">
              <SoapSection title="Subjective" body={activeCase.soap.subjective} />
              <SoapSection title="Objective" body={activeCase.soap.objective} />
              <SoapSection title="Assessment" body={activeCase.soap.assessment} />
              <label className="grid gap-2">
                  <h3 className="text-2xl font-bold tracking-tight">Plan Draft</h3>
                  <textarea
                    value={planDraft}
                    onChange={(event) => setPlanDraft(event.target.value)}
                    className="w-full min-h-48 rounded-xl border border-gray-200 bg-white p-4 text-base text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
              </label>
            </div>

            <details className="rounded-xl border bg-gray-50 p-4">
                <summary className="cursor-pointer font-semibold text-gray-800 flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-gray-500" />
                    View Full Intake JSON
                </summary>
                <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-white/80">
                    {JSON.stringify(activeCase.normalized_intake, null, 2)}
                </pre>
            </details>
        </div>
    )
}
