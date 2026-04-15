"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { type IntakeFormInput } from "@/lib/schemas/intake";
import { type AssessmentResult, type SoapDraft } from "@/lib/schemas/soap";
import { IntakeQuestionnaire } from "./intake-questionnaire";

type WorkflowResponse = {
  encounterId: string;
  normalizedIntake: unknown;
  assessmentResults: AssessmentResult[];
  soap: SoapDraft;
  persisted: boolean;
};

// This is a mock user role. In a real application, you would get this from your auth provider.
const userRole = "practitioner";

export function IntakeWorkbench() {
  const [workflowResponse, setWorkflowResponse] = useState<WorkflowResponse | null>(
    null
  );
  const [submitState, setSubmitState] = useState<{
    pending: boolean;
    error: string | null;
    status: string;
  }>({
    pending: false,
    error: null,
    status: "Ready",
  });

  async function runWorkflow(values: IntakeFormInput) {
    setSubmitState({
      pending: true,
      error: null,
      status: "Normalizing intake and scoring patterns...",
    });

    try {
      const intakeResponse = await fetch("/api/intake/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!intakeResponse.ok) {
        throw new Error("Unable to submit intake.");
      }

      const intakePayload = (await intakeResponse.json()) as {
        encounterId: string;
        normalizedIntake: unknown;
        persisted: boolean;
      };

      setSubmitState((current) => ({
        ...current,
        status: "Generating assessment...",
      }));

      const assessmentResponse = await fetch(
        `/api/encounters/${intakePayload.encounterId}/assess`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            normalized_intake: intakePayload.normalizedIntake,
          }),
        }
      );

      if (!assessmentResponse.ok) {
        throw new Error("Unable to score the intake.");
      }

      const assessmentPayload = (await assessmentResponse.json()) as {
        assessmentResults: AssessmentResult[];
      };

      setSubmitState((current) => ({
        ...current,
        status: "Drafting SOAP note...",
      }));

      const soapResponse = await fetch(
        `/api/encounters/${intakePayload.encounterId}/generate-soap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            normalized_intake: intakePayload.normalizedIntake,
            assessment_results: assessmentPayload.assessmentResults,
          }),
        }
      );

      if (!soapResponse.ok) {
        throw new Error("Unable to generate the SOAP draft.");
      }

      const soapPayload = (await soapResponse.json()) as {
        soap: SoapDraft;
      };

      setWorkflowResponse({
        encounterId: intakePayload.encounterId,
        normalizedIntake: intakePayload.normalizedIntake,
        assessmentResults: assessmentPayload.assessmentResults,
        soap: soapPayload.soap,
        persisted: intakePayload.persisted,
      });

      setSubmitState({
        pending: false,
        error: null,
        status: "Workflow complete",
      });
    } catch (error) {
      setSubmitState({
        pending: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
        status: "Workflow failed",
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className={userRole === 'practitioner' ? "card-grid" : ""}>
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="section-label">Guided Intake</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Structured intake for the focused V1 workflow
              </h1>
              <p className="max-w-2xl leading-7 text-[color:var(--muted)]">
                This wizard captures the intake, then runs the exact V1 chain:
                normalized JSON, deterministic pattern scoring, and a draft SOAP
                note with manual plan editing left to the practitioner.
              </p>
            </div>
            <IntakeQuestionnaire
              onSubmit={runWorkflow}
              isSubmitting={submitState.pending}
              submissionStatus={submitState.status}
              submissionError={submitState.error}
            />
          </div>
        </section>
        {userRole === "practitioner" && (
          <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Output Preview</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Structured assessment and SOAP
                </h2>
              </div>
              <Sparkles className="h-5 w-5 text-[color:var(--accent)]" />
            </div>

            {workflowResponse ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                  <p className="section-label">Assessment</p>
                  <div className="mt-4 space-y-3">
                    {workflowResponse.assessmentResults.map((result) => (
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
                    <SoapSection
                      title="Subjective"
                      body={workflowResponse.soap.subjective}
                    />
                    <SoapSection
                      title="Objective"
                      body={workflowResponse.soap.objective}
                    />
                    <SoapSection
                      title="Assessment"
                      body={workflowResponse.soap.assessment}
                    />
                    <SoapSection
                      title="Plan Draft"
                      body={workflowResponse.soap.plan_draft}
                    />
                  </div>
                </div>

                <details className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                  <summary className="cursor-pointer font-semibold">
                    Expand normalized JSON
                  </summary>
                  <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#132025] p-4 text-xs leading-6 text-[#d9f3ef]">
                    {JSON.stringify(
                      workflowResponse.normalizedIntake,
                      null,
                      2
                    )}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[color:var(--line)] p-8 text-sm leading-7 text-[color:var(--muted)]">
                Submit the intake to preview the normalized payload, top
                clinical patterns, and a draft SOAP note generated through the
                V1 workflow.
              </div>
            )}
          </section>
        )}
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
