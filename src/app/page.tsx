
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  LayoutPanelLeft,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 bg-gray-50/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Intake V1
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              A better workflow for you and your patients.
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              Streamline your patient intake process with a simple, modern, and
              efficient system. Capture patient information, assess symptoms, and
              generate SOAP notes—all in one place.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/questionnaire"
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md transition-transform hover:scale-105 hover:bg-blue-700"
              >
                Patient Intake Form
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-md ring-1 ring-inset ring-gray-300 transition-transform hover:scale-105"
              >
                Practitioner Dashboard
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <Feature
              icon={ClipboardList}
              title="Simplified Patient Intake"
              description="A clean, intuitive form for patients to provide their information from any device."
            />
            <Feature
              icon={FileText}
              title="Automated SOAP Notes"
              description="Automatically generate structured SOAP notes from patient intake data to save time."
            />
            <Feature
              icon={LayoutPanelLeft}
              title="Centralized Dashboard"
              description="A dedicated dashboard for practitioners to view and manage all patient encounters."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature(props: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  const Icon = props.icon;
  return (
    <div className="flex gap-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{props.title}</h3>
        <p className="mt-1 text-gray-600">{props.description}</p>
      </div>
    </div>
  );
}

