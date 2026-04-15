"use client";

import { useState } from "react";
import { PatientIntakeForm } from "@/components/intake/patient-intake-form";
import { type IntakeFormInput } from "@/lib/schemas/intake";

export default function QuestionnairePage() {
  const [submission, setSubmission] = useState<{
    isSubmitted: boolean;
    pending: boolean;
    error: string | null;
    status: string;
  }>({
    isSubmitted: false,
    pending: false,
    error: null,
    status: "Ready",
  });

  async function submitIntake(values: IntakeFormInput) {
    setSubmission({ ...submission, pending: true, status: "Submitting..." });
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

      setSubmission({ isSubmitted: true, pending: false, error: null, status: "Submitted successfully!" });
    } catch (error) {
      setSubmission({
        ...submission,
        pending: false,
        error: "An unexpected error occurred.",
        status: "Submission failed",
      });
    }
  }

  if (submission.isSubmitted) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-5 py-8 sm:px-8 lg:px-12">
        <div className="glass-panel rounded-[2rem] p-6 text-center sm:p-8">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Thank you!
            </h1>
            <p className="mt-4 max-w-2xl mx-auto leading-7 text-[color:var(--muted)]">
                Your intake form has been submitted successfully.
            </p>
            <button
                onClick={() => alert("Redirecting to appointment booking...")}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
                >
                Book an Appointment
            </button>
        </div>
      </div>
    );
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
      <PatientIntakeForm
        onSubmit={submitIntake}
        isSubmitting={submission.pending}
        submissionStatus={submission.status}
        submissionError={submission.error}
      />
    </div>
  );
}
