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

// Main Dashboard Shell
export function DashboardShell({ cases }: { cases: DashboardCase[] }) {
  const [selectedId, setSelectedId] = useState(cases[0]?.id ?? "");

  if (cases.length === 0) {
    return <EmptyState />;
  }

  const activeCase = cases.find((item) => item.id === selectedId) ?? cases[0];

  return (
    <div className="flex h-full flex-1 gap-6">
      <aside className="w-96 rounded-2xl bg-gray-50 p-4">
        <h2 className="px-2 text-lg font-semibold text-gray-800">Patients</h2>
        <div className="mt-4 space-y-2">
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
      <main className="flex-1 rounded-2xl bg-white p-6 shadow-sm">
        <PatientDetail case={activeCase} />
      </main>
    </div>
  );
}

// Displays when no cases are available
function EmptyState() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
      <h2 className="text-2xl font-semibold">No patient encounters yet.</h2>
      <p className="mt-2 text-gray-600">As patients complete the intake form, they will appear here.</p>
      <Link href="/patients" className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 font-semibold text-white">
        Create New Patient
        <ChevronRight className="h-5 w-5" />
      </Link>
    </section>
  );
}

// List item for the patient selector
function PatientListItem({ item, isActive, onClick }: { item: DashboardCase; isActive: boolean; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl p-4 text-left transition-colors ${isActive ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 hover:bg-gray-200"}`}>
      <p className="font-semibold">{item.patient.first_name} {item.patient.last_name}</p>
      <p className={`mt-1 text-sm ${isActive ? "text-blue-100" : "text-gray-500"}`}>
        {item.subjective.chief_complaint.summary}
      </p>
    </button>
  );
}

// Main view for the selected patient's details
function PatientDetail({ case: activeCase }: { case: DashboardCase }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{activeCase.patient.first_name} {activeCase.patient.last_name}</h1>
        <p className="mt-1 text-gray-500">Submitted: {new Date(activeCase.submitted_at).toLocaleDateString()}</p>
      </header>
      <div className="space-y-4">
        <SubjectiveView subjective={activeCase.subjective} />
        <ObjectiveView objective={activeCase.objective} />
        <AssessmentView assessments={activeCase.assessments} />
      </div>
    </div>
  );
}

// Accordion component for expandable sections
function Accordion({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType; }) {
  return (
    <details open className="group rounded-lg border bg-gray-50 p-4">
      <summary className="flex cursor-pointer items-center gap-3 font-semibold text-gray-800">
        <Icon className="h-5 w-5 text-gray-500" />
        {title}
      </summary>
      <div className="mt-4 space-y-2 pl-8 text-gray-700">{children}</div>
    </details>
  );
}

// View for Subjective data
function SubjectiveView({ subjective }: { subjective: DashboardCase['subjective']; }) {
    return (
        <Accordion title="Subjective" icon={User}>
            <p><strong>Chief Complaint:</strong> {subjective.chief_complaint.summary}</p>
            <p><strong>History of Present Illness:</strong> {subjective.history_of_present_illness.summary}</p>
            <p><strong>Review of Systems:</strong> {subjective.review_of_systems.summary}</p>
            <p><strong>Past Medical History:</strong> {subjective.past_medical_history.summary}</p>
            <p><strong>Medications:</strong> {subjective.medications.summary}</p>
            <Accordion title="Social History" icon={FileText}>
                <p><strong>Environment:</strong> {subjective.social_history.environment.summary}</p>
                <p><strong>Body:</strong> {subjective.social_history.body.summary}</p>
                <p><strong>Mind:</strong> {subjective.social_history.mind.summary}</p>
            </Accordion>
        </Accordion>
    );
}

// View for Objective data
function ObjectiveView({ objective }: { objective: DashboardCase['objective']; }) {
    return (
        <Accordion title="Objective" icon={HeartPulse}>
            <p><strong>Age:</strong> {objective.demographics.summary}</p>
            <p><strong>Vitals:</strong> {objective.vitals.summary}</p>
            <p><strong>Physical Exam:</strong> {objective.physical_exam.summary}</p>
            <p><strong>Labs & Imaging:</strong> {objective.labs_and_imaging.summary}</p>
            <p><strong>Risk Scores:</strong> {objective.risk_scores.summary}</p>
        </Accordion>
    );
}

// View for Assessment and Plan data
function AssessmentView({ assessments }: { assessments: DashboardCase['assessments']; }) {
  return (
    <Accordion title="Assessment & Plan" icon={Stethoscope}>
      {assessments.map((assessment) => (
        <div key={assessment.id} className="mt-4 rounded-lg border bg-white p-4">
          <h4 className="font-bold text-lg">{assessment.diagnosis} <span className="font-mono text-sm text-gray-500">({assessment.icd_code})</span></h4>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip label="Status" value={assessment.status} />
            <Chip label="Severity" value={assessment.severity} />
          </div>
          <Accordion title="Plan" icon={FileText}>
            <div className="space-y-2">
              <EditablePlanItem label="Medications" initialValue={assessment.plan.medications.summary} />
              <EditablePlanItem label="Testing" initialValue={assessment.plan.testing.summary} />
              <EditablePlanItem label="Referrals" initialValue={assessment.plan.referrals.summary} />
              <EditablePlanItem label="Lifestyle" initialValue={assessment.plan.lifestyle.summary} />
              <EditablePlanItem label="Monitoring" initialValue={assessment.plan.monitoring.summary} />
              <EditablePlanItem label="Follow-up" initialValue={assessment.plan.follow_up.summary} />
              <EditablePlanItem label="Preventive Care" initialValue={assessment.plan.preventive_care.summary} />
            </div>
          </Accordion>
        </div>
      ))}
    </Accordion>
  );
}

// Chip component for displaying status/severity
function Chip({ label, value }: { label: string; value: string; }) {
    return (
        <div className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
            <span className="font-semibold">{label}:</span> {value}
        </div>
    )
}

// Component for editable plan items
function EditablePlanItem({ label, initialValue }: { label: string; initialValue: string; }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);

    const handleSave = () => {
        setIsEditing(false);
        // Here you would typically trigger an API call to save the changes.
        // For now, we just update the local state.
    };

    return (
        <div className="flex items-start gap-4">
            <strong className="w-32 flex-shrink-0">{label}:</strong>
            {isEditing ? (
                <div className="flex-grow">
                    <textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                        rows={3}
                    />
                    <div className="mt-2 flex gap-2">
                        <button onClick={handleSave} className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white">Save</button>
                        <button onClick={() => { setIsEditing(false); setValue(initialValue); }} className="rounded-md bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-700">Cancel</button>
                    </div>
                </div>
            ) : (
                <p onClick={() => setIsEditing(true)} className="flex-grow cursor-pointer rounded-md p-2 hover:bg-gray-100">
                    {value || <span className="text-gray-400">Click to add...</span>}
                </p>
            )}
        </div>
    );
}
