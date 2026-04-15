"use client";

import { useState } from "react";
import { CheckCircle2, Copy, FileJson } from "lucide-react";
import { type DashboardCase } from "@/lib/demo/sample-cases";

export function DashboardShell({ cases }: { cases: DashboardCase[] }) {
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [planDrafts, setPlanDrafts] = useState<Record<string, string>>(
    Object.fromEntries(cases.map((item) => [item.id, item.soap.plan_draft]))
  );
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  const activeCase = cases.find((item) => item.id === selectedId) ?? cases[0];

  if (!activeCase) {
    return null;
  }

  function handleCopy() {
    if (copied) {
      return;
    }

    window.navigator.clipboard.writeText(JSON.stringify(activeCase, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card-grid">
      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Patients</p>
            <h2 className="mt-2 text-2xl font-semibold">Encounter list</h2>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {cases.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${selectedId === item.id ? "border-transparent bg-[color:var(--accent)] text-white" : "border-[color:var(--line)] bg-[color:var(--surface-strong)]"}`}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {item.patient.first_name} {item.patient.last_name}
                </div>
                <div className="font-mono text-xs">
                  {new Date(item.submitted_at).toLocaleDateString()}
                </div>
              </div>
              <p className={`mt-2 text-sm leading-6 ${selectedId === item.id ? "text-white/80" : "text-[color:var(--muted)]"}`}>
                {item.chief_complaint}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">SOAP Note</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {activeCase.patient.first_name} {activeCase.patient.last_name}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="shrink-0 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-2.5 transition-colors hover:bg-[color:var(--surface-raised)]">
              {copied ? (
                <CheckCircle2 className="h-5 w-5 text-[color:var(--accent)]" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="section-label">Assessment</p>
                <div className="mt-4 space-y-3">
                  {activeCase.assessment.results.map((result) => (
                    <div
                      key={result.pattern_key}
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
                  <SoapSection title="Plan Draft" body={activeCase.soap.plan_draft} />
                </div>
              </div>

              <details className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <summary className="cursor-pointer font-semibold">
                  Expand normalized JSON
                </summary>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#132025] p-4 text-xs leading-6 text-[#d9f3ef]">
                  {JSON.stringify(activeCase.normalized_intake, null, 2)}
                </pre>
              </details>
        </div>
      </div>
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
