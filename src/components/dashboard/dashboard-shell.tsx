"use client";

import { useState } from "react";
import { CheckCircle2, Copy, FileJson } from "lucide-react";
import { type DashboardCase } from "@/lib/demo/sample-cases";

export function DashboardShell({ cases }: { cases: DashboardCase[] }) {
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [planDrafts, setPlanDrafts] = useState<Record<string, string>>(
    Object.fromEntries(cases.map((item) => [item.id, item.soap.plan_draft])),
  );
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});

  const activeCase = cases.find((item) => item.id === selectedId) ?? cases[0];

  if (!activeCase) {
    return null;
  }

  const copySoap = async () => {
    const assembledSoap = `S\n${activeCase.soap.subjective}\n\nO\n${activeCase.soap.objective}\n\nA\n${activeCase.soap.assessment}\n\nP\n${planDrafts[activeCase.id]}`;
    await navigator.clipboard.writeText(assembledSoap);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="glass-panel rounded-[2rem] p-5">
          <div>
            <p className="section-label">Patients</p>
            <h1 className="mt-2 text-2xl font-semibold">Practitioner queue</h1>
          </div>
          <div className="mt-5 space-y-3">
            {cases.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                  item.id === activeCase.id
                    ? "border-transparent bg-[color:var(--foreground)] text-[color:var(--background)]"
                    : "border-[color:var(--line)] bg-[color:var(--surface-strong)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.patientName}</div>
                    <div
                      className={`mt-2 text-sm leading-6 ${
                        item.id === activeCase.id
                          ? "text-[color:var(--background)]/78"
                          : "text-[color:var(--muted)]"
                      }`}
                    >
                      {item.chiefComplaint}
                    </div>
                  </div>
                  {reviewed[item.id] ? (
                    <CheckCircle2 className="h-5 w-5 text-[#76d3a9]" />
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="section-label">SOAP Workspace</p>
              <h2 className="mt-2 text-3xl font-semibold">{activeCase.patientName}</h2>
              <p className="mt-2 max-w-3xl leading-7 text-[color:var(--muted)]">
                {activeCase.chiefComplaint}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={copySoap}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm font-semibold"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Copy summary"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setReviewed((current) => ({ ...current, [activeCase.id]: true }))
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark as reviewed
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div className="space-y-5">
              <SoapBlock title="Subjective" body={activeCase.soap.subjective} />
              <SoapBlock title="Objective" body={activeCase.soap.objective} />
              <SoapBlock title="Assessment" body={activeCase.soap.assessment} />
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Plan</h3>
                  <span className="text-sm text-[color:var(--muted)]">Manual edit</span>
                </div>
                <textarea
                  value={planDrafts[activeCase.id]}
                  onChange={(event) =>
                    setPlanDrafts((current) => ({
                      ...current,
                      [activeCase.id]: event.target.value,
                    }))
                  }
                  className="mt-4 min-h-52 w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-4 text-sm leading-7 outline-none focus:border-[color:var(--accent)]"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="section-label">Assessment Evidence</p>
                <div className="mt-4 space-y-3">
                  {activeCase.assessmentResults.map((item) => (
                    <div
                      key={item.pattern_key}
                      className="rounded-2xl border border-[color:var(--line)] px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-semibold">{item.label}</div>
                        <div className="font-mono text-xs text-[color:var(--muted)]">
                          {item.confidence.toFixed(2)}
                        </div>
                      </div>
                      <div className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                        {item.evidence.join(" ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <details className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                  <FileJson className="h-4 w-4 text-[color:var(--accent)]" />
                  Expand raw data
                </summary>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#132025] p-4 text-xs leading-6 text-[#d9f3ef]">
                  {JSON.stringify(activeCase.normalized, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SoapBlock(props: { title: string; body: string }) {
  return (
    <section className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
      <h3 className="text-lg font-semibold">{props.title}</h3>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-[color:var(--muted)]">
        {props.body}
      </p>
    </section>
  );
}
