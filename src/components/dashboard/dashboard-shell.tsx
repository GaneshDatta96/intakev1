"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  HeartPulse,
  Stethoscope,
  User,
} from "lucide-react";
import { type DashboardCase } from "@/lib/schemas/modern-soap";

export function DashboardShell({ cases }: { cases: DashboardCase[] }) {
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");

  if (cases.length === 0) {
    return <EmptyState />;
  }

  const activeCase = cases.find((item) => item.id === selectedId) ?? cases[0];

  return (
    <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(24rem,28rem)_minmax(0,1fr)] 2xl:grid-cols-[30rem_minmax(0,1fr)]">
      <aside className="glass-panel rounded-[2rem] p-4 sm:p-5">
        <div className="flex items-end justify-between gap-4 px-2">
          <div>
            <p className="section-label">Encounter Queue</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
              Patients
            </h2>
          </div>
          <span className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-1 text-sm font-semibold text-[color:var(--muted-strong)]">
            {cases.length}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {cases.map((item) => (
            <PatientListItem
              key={item.id}
              item={item}
              isActive={selectedId === item.id}
              onClick={() => setSelectedId(item.id)}
            />
          ))}
        </div>
      </aside>

      <main className="min-w-0 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-5 shadow-[0_20px_70px_rgba(27,44,52,0.1)] sm:p-6 lg:p-8">
        <PatientDetail case={activeCase} />
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-8 text-center shadow-[0_20px_70px_rgba(27,44,52,0.08)]">
      <p className="section-label">Practitioner Dashboard</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
        No patient encounters yet.
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
        As patients complete the intake form, their structured encounter cards
        will appear here for review.
      </p>
      <Link
        href="/patients"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
      >
        Create New Patient
        <ChevronRight className="h-5 w-5" />
      </Link>
    </section>
  );
}

function PatientListItem({
  item,
  isActive,
  onClick,
}: {
  item: DashboardCase;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition duration-150 ${
        isActive
          ? "border-transparent bg-[color:var(--foreground)] text-white shadow-[0_18px_45px_rgba(20,33,37,0.22)]"
          : "border-[color:var(--line)] bg-white/70 text-[color:var(--foreground)] hover:border-[color:var(--line-strong)] hover:bg-white"
      }`}
    >
      <p className="text-lg font-semibold tracking-[-0.03em]">
        {item.patient.first_name} {item.patient.last_name}
      </p>
      <p
        className={`mt-2 text-sm leading-6 ${
          isActive ? "text-white/75" : "text-[color:var(--muted)]"
        }`}
      >
        {item.subjective.chief_complaint.summary}
      </p>
      <div
        className={`mt-4 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.18em] ${
          isActive ? "text-white/60" : "text-[color:var(--muted)]"
        }`}
      >
        <span>Submitted</span>
        <span>{formatDate(item.submitted_at)}</span>
      </div>
    </button>
  );
}

function PatientDetail({ case: activeCase }: { case: DashboardCase }) {
  return (
    <div className="space-y-5">
      <header className="rounded-[1.75rem] border border-[color:var(--line)] bg-white/80 px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="section-label">Selected Encounter</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[2.75rem]">
              {activeCase.patient.first_name} {activeCase.patient.last_name}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[color:var(--muted-strong)]">
              {activeCase.subjective.chief_complaint.summary}
            </p>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:min-w-[260px]">
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3">
              <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Submitted
              </dt>
              <dd className="mt-2 font-semibold text-[color:var(--foreground)]">
                {formatDate(activeCase.submitted_at)}
              </dd>
            </div>
            <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3">
              <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Assessments
              </dt>
              <dd className="mt-2 font-semibold text-[color:var(--foreground)]">
                {activeCase.assessments.length}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="space-y-4">
        <SubjectiveView subjective={activeCase.subjective} />
        <ObjectiveView objective={activeCase.objective} />
        <AssessmentView assessments={activeCase.assessments} />
      </div>
    </div>
  );
}

function Accordion({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <details
      open
      className="group rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 p-5 shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)]">
            <Icon className="h-5 w-5 text-[color:var(--accent)]" />
          </span>
          <span className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
            {title}
          </span>
        </div>
        <ChevronRight className="h-5 w-5 text-[color:var(--muted)] transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-5 space-y-4">{children}</div>
    </details>
  );
}

function SubjectiveView({
  subjective,
}: {
  subjective: DashboardCase["subjective"];
}) {
  return (
    <Accordion title="Subjective" icon={User}>
      <div className="grid gap-3 xl:grid-cols-2">
        <DetailRow
          label="Chief Complaint"
          value={subjective.chief_complaint.summary}
        />
        <DetailRow
          label="History of Present Illness"
          value={subjective.history_of_present_illness.summary}
        />
        <DetailRow
          label="Review of Systems"
          value={subjective.review_of_systems.summary}
        />
        <DetailRow
          label="Past Medical History"
          value={subjective.past_medical_history.summary}
        />
        <DetailRow label="Medications" value={subjective.medications.summary} />
      </div>

      <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-white/80">
            <FileText className="h-5 w-5 text-[color:var(--accent)]" />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
              Social History
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              Environment, body, and mind context.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          <DetailRow
            label="Environment"
            value={subjective.social_history.environment.summary}
          />
          <DetailRow label="Body" value={subjective.social_history.body.summary} />
          <DetailRow label="Mind" value={subjective.social_history.mind.summary} />
        </div>
      </div>
    </Accordion>
  );
}

function ObjectiveView({
  objective,
}: {
  objective: DashboardCase["objective"];
}) {
  return (
    <Accordion title="Objective" icon={HeartPulse}>
      <div className="grid gap-3 xl:grid-cols-2">
        <DetailRow label="Demographics" value={objective.demographics.summary} />
        <DetailRow label="Vitals" value={objective.vitals.summary} />
        <DetailRow label="Physical Exam" value={objective.physical_exam.summary} />
        <DetailRow
          label="Labs & Imaging"
          value={objective.labs_and_imaging.summary}
        />
        <DetailRow label="Risk Scores" value={objective.risk_scores.summary} />
      </div>
    </Accordion>
  );
}

function AssessmentView({
  assessments,
}: {
  assessments: DashboardCase["assessments"];
}) {
  return (
    <Accordion title="Assessment & Plan" icon={Stethoscope}>
      <div className="space-y-4">
        {assessments.map((assessment) => (
          <div
            key={assessment.id}
            className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h4 className="text-xl font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                  {assessment.diagnosis}
                </h4>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  ICD {assessment.icd_code}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip label="Status" value={assessment.status} />
                <Chip label="Severity" value={assessment.severity} />
              </div>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-[color:var(--line)] bg-white/75 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)]">
                  <FileText className="h-5 w-5 text-[color:var(--accent)]" />
                </span>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--foreground)]">
                    Plan
                  </p>
                  <p className="text-sm text-[color:var(--muted)]">
                    Click any line to refine it.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <EditablePlanItem
                  label="Medications"
                  initialValue={assessment.plan.medications.summary}
                />
                <EditablePlanItem
                  label="Testing"
                  initialValue={assessment.plan.testing.summary}
                />
                <EditablePlanItem
                  label="Referrals"
                  initialValue={assessment.plan.referrals.summary}
                />
                <EditablePlanItem
                  label="Lifestyle"
                  initialValue={assessment.plan.lifestyle.summary}
                />
                <EditablePlanItem
                  label="Monitoring"
                  initialValue={assessment.plan.monitoring.summary}
                />
                <EditablePlanItem
                  label="Follow-up"
                  initialValue={assessment.plan.follow_up.summary}
                />
                <EditablePlanItem
                  label="Preventive Care"
                  initialValue={assessment.plan.preventive_care.summary}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Accordion>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-[color:var(--foreground)]">
        {value || "Not provided."}
      </p>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[color:var(--line)] bg-white px-3 py-1.5 text-sm text-[color:var(--muted-strong)]">
      <span className="font-semibold text-[color:var(--foreground)]">
        {label}:
      </span>{" "}
      {value}
    </div>
  );
}

function EditablePlanItem({
  label,
  initialValue,
}: {
  label: string;
  initialValue: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className="grid gap-2 lg:grid-cols-[150px_minmax(0,1fr)] lg:items-start">
      <strong className="pt-3 text-sm uppercase tracking-[0.08em] text-[color:var(--muted-strong)]">
        {label}
      </strong>
      {isEditing ? (
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white p-3 shadow-sm">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="min-h-28 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm leading-7 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20"
            rows={4}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setValue(initialValue);
              }}
              className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[color:var(--surface-strong)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-left text-sm leading-7 text-[color:var(--foreground)] transition hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)]"
        >
          {value || (
            <span className="text-[color:var(--muted)]">Click to add...</span>
          )}
        </button>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
