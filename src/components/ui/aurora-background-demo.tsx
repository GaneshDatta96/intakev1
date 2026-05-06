"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardPlus,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { AuroraButton } from "@/components/ui/aurora-button";

const workflowHighlights = [
  "Create a patient",
  "Share a unique intake link",
  "Collect structured responses",
  "Review SOAP-ready context",
];

export function AuroraBackgroundDemo() {
  const scrollToWorkflow = () => {
    document.getElementById("workflow")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <AuroraBackground className="min-h-[calc(100vh-4.5rem)] px-5 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 py-16 text-center"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
          <Sparkles className="size-4" />
          Aurora Hero Demo
        </div>

        <div className="space-y-5">
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-7xl lg:leading-[1.02]">
            Create a patient, share the intake link, and review SOAP-ready
            context before the visit starts.
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
            This aurora background works best as a full-width marketing hero
            for the app, where it can introduce the workflow before users move
            into the patient and practitioner flows.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <AuroraButton
            type="button"
            onClick={scrollToWorkflow}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            glowClassName="rounded-full from-fuchsia-500 via-cyan-300 to-emerald-300"
          >
            See Workflow
            <ArrowRight className="size-4" />
          </AuroraButton>
          <Link
            href="/create-demo"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-92"
          >
            <ClipboardPlus className="size-4" />
            Create Demo Route
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
          >
            <LayoutDashboard className="size-4" />
            View Practitioner Dashboard
          </Link>
          <Link
            href="/intake"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white/55 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white/80"
          >
            View Patient Experience
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {workflowHighlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-sm"
            >
              {highlight}
            </span>
          ))}
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
