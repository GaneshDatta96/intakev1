"use client";
import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <div className="bg-gray-50 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 font-light">
      <main className="max-w-5xl mx-auto">

        {/* 1. HERO */}
        <section className="text-center py-28">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-tight">
            A Calmer, More Considered<br />Clinical Workflow.
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-gray-600 dark:text-gray-400">
            We design and build custom patient intake systems that reduce administrative work and elevate the patient experience.
          </p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            *This is a live demonstration of our build capabilities.*
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/intake" className="px-6 py-3 rounded-md bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors">
              Explore Patient Intake
            </Link>
            <Link href="/dashboard" className="px-6 py-3 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              Explore Practitioner View
            </Link>
          </div>
        </section>

        {/* 2. VISUAL PREVIEW BLOCK */}
        <section className="py-20 bg-white dark:bg-zinc-800/50 rounded-lg">
          <p className="text-center text-lg md:text-xl max-w-4xl mx-auto text-gray-700 dark:text-gray-300">
            Experience the workflow from both sides: a thoughtful, intelligent intake for your patients and a clear, organized dashboard for your practitioners.
          </p>
          {/* Placeholder for visual elements */}
        </section>

        {/* 3. THREE CORE BENEFITS */}
        <section className="py-28">
          <div className="grid md:grid-cols-3 gap-16 text-center">
            <div>
              <h2 className="text-xl font-normal">Reclaim Your Administrative Hours.</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">A streamlined digital process replaces manual data entry and paperwork.</p>
            </div>
            <div>
              <h2 className="text-xl font-normal">Improve Intake Data Quality.</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Receive complete, structured, and legible patient information, every time.</p>
            </div>
            <div>
              <h2 className="text-xl font-normal">Offer a Premium Patient Experience.</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">A calm, intuitive first impression that reflects the quality of your care.</p>
            </div>
          </div>
        </section>

        {/* 4. WHO THIS IS FOR */}
        <section className="py-28 text-center bg-gray-100 dark:bg-zinc-800/50 rounded-lg">
           <h2 className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Who We Partner With</h2>
           <p className="mt-4 text-2xl md:text-3xl max-w-3xl mx-auto">
            Designed for Modern Practices
           </p>
           <p className="mt-4 max-w-3xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
            We partner with forward-thinking clinics, private practices, and specialized healthcare teams to build workflows tailored precisely to their needs and clinical models.
           </p>
        </section>

        {/* 5. WHY THIS MATTERS */}
        <section className="py-28">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl">The Clinical Impact of a Better Workflow.</h2>
          </div>
          <div className="mt-12 max-w-2xl mx-auto">
            <ul className="space-y-4 text-lg">
              <li className="flex items-start"><span className="text-teal-600 dark:text-teal-500 mr-3 mt-1">✓</span><span>Significantly reduce practitioner and staff administrative time.</span></li>
              <li className="flex items-start"><span className="text-teal-600 dark:text-teal-500 mr-3 mt-1">✓</span><span>Ensure higher-quality, more consistent intake data.</span></li>
              <li className="flex items-start"><span className="text-teal-600 dark:text-teal-500 mr-3 mt-1">✓</span><span>Prepare for consultations with a clearer clinical picture.</span></li>
              <li className="flex items-start"><span className="text-teal-600 dark:text-teal-500 mr-3 mt-1">✓</span><span>Provide a respectful and professional patient experience.</span></li>
            </ul>
          </div>
        </section>

        {/* 6. DEMO FRAMING (CRITICAL) */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto p-8 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-zinc-800/50 text-center">
            <h2 className="text-2xl md:text-3xl">This Is Not a Product. It’s a Demonstration.</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg">
              What you're seeing is not a generic software template. It is an interactive example of a custom-built system, designed to show you what is possible. The final workflow we build for you will be unique to your practice.
            </p>
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section className="text-center py-28">
          <h2 className="text-3xl md:text-4xl max-w-2xl mx-auto">See What a Custom Workflow Could Look Like for Your Clinic.</h2>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="#" className="px-6 py-3 rounded-md bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors">
              Book a Walkthrough
            </Link>
            <Link href="#" className="px-6 py-3 rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              Request a Custom Build
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
