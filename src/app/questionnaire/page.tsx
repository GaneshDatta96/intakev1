"use client";

import { useState } from "react";
import { IntakeQuestionnaire } from "@/components/intake/intake-questionnaire";
import { type IntakeFormInput } from "@/lib/schemas/intake";

export default function QuestionnairePage() {
  const [submitState, setSubmitState] = useState<{
    pending: boolean;
    error: string | null;
    status: string;
  }>({
    pending: false,
    error: null,
    status: "Ready",
  });

  async function submitIntake(values: IntakeFormInput) {
    setSubmitState({ pending: true, error: null, status: "Submitting..." });
    try {
      const response = await fetch("/api/intake/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setSubmitState({ pending: false, error: null, status: "Submitted successfully!" });
    } catch (error) {
      setSubmitState({
        pending: false,
        error: "An unexpected error occurred.",
        status: "Submission failed",
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12">
      <div className="space-y-2">
        <p className="section-label">Patient Intake</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Share your health information
        </h1>
        <p className="max-w-2xl leading-7 text-[color:var(--muted)]">
          Please fill out this form to the best of your ability. Your responses
          will help us understand your health concerns and goals.
        </p>
      </div>
      <IntakeQuestionnaire
        onSubmit={submitIntake}
        isSubmitting={submitState.pending}
        submissionStatus={submitState.status}
        submissionError={submitState.error}
      />
    </div>
  );
}
