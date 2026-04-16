"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import Link from "next/link";

export default function Home() {
  return (
    (<AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        {/* 1. HERO SECTION */}
        <section className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold dark:text-white">
            Stop drowning in paperwork.
            <br />
            Start focusing on patients.
          </h1>
          <p className="font-extralight text-base md:text-xl dark:text-neutral-200 py-4">
            Go from hours of tedious admin to clear, concise, and complete patient intakes—in minutes.
          </p>
          <p className="text-sm dark:text-neutral-400 mb-8">
            This is a LIVE DEMO of a custom-built clinical workflow system.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/intake" className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-6 py-3 font-semibold">
                Patient Experience
            </Link>
            <Link href="/dashboard" className="border border-white rounded-full w-fit text-white px-6 py-3 font-semibold">
                Practitioner Dashboard
            </Link>
          </div>
        </section>

        {/* 2. INTRO STRIP */}
        <section className="my-16 py-4">
          <p className="text-center text-lg md:text-2xl dark:text-neutral-300">
            A calmer clinic starts with a better workflow. For your patients, and for you.
          </p>
        </section>

        {/* 3. VISUAL SECTION */}
        <section className="text-center my-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div>
                    <h3 className="text-2xl font-bold mb-2">Patient Intake</h3>
                    <p className="dark:text-neutral-300">A streamlined, intelligent intake process your patients will appreciate.</p>
                </div>
                <div>
                    <h3 className="text-2xl font-bold mb-2">Practitioner Dashboard</h3>
                    <p className="dark:text-neutral-300">A clear, actionable dashboard to review cases before you even step into the room.</p>
                </div>
            </div>
        </section>

        {/* 4. THREE CORE BENEFITS */}
        <section className="my-16 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <h3 className="text-xl font-bold mb-2">Reclaim Your Time from Administrative Tasks</h3>
              <p className="dark:text-neutral-300">Our system automates the tedious parts of patient intake and documentation. It intelligently gathers information, organizes it, and presents it in a clinical format, significantly reducing the time you spend on paperwork.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Improve the Quality and Consistency of Patient Data</h3>
              <p className="dark:text-neutral-300">Eliminate incomplete or illegible intake forms. Our guided process ensures you receive standardized, high-quality information for every patient, every time. This leads to more efficient consultations and better-informed clinical decisions.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Deliver a Modern, Premium Patient Experience</h3>
              <p className="dark:text-neutral-300">First impressions matter. Offer your patients a calm, professional, and intuitive intake experience that reflects the quality of your care. It’s a simple, respectful process that can be completed from anywhere.</p>
            </div>
          </div>
        </section>

        {/* 5. "WHO THIS IS FOR" */}
        <section className="my-16 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Designed for practitioners who value their time and their patients' experience.</h2>
            <p className="dark:text-neutral-300 mb-8">We build custom workflows for:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-4 rounded-lg">
                    <h4 className="font-bold text-lg">Forward-thinking Clinics</h4>
                    <p className="dark:text-neutral-400">Ready to modernize their operations and reduce administrative overhead.</p>
                </div>
                <div className="p-4 rounded-lg">
                    <h4 className="font-bold text-lg">Specialized Private Practices</h4>
                    <p className="dark:text-neutral-400">Seeking a tailored workflow that fits their unique intake and documentation needs.</p>
                </div>
                <div className="p-4 rounded-lg">
                    <h4 className="font-bold text-lg">Growing Healthcare Teams</h4>
                    <p className="dark:text-neutral-400">Needing a scalable system that ensures consistency and quality as the practice expands.</p>
                </div>
            </div>
        </section>

        {/* 6. "WHY THIS MATTERS" */}
        <section className="my-16 max-w-3xl mx-auto text-left">
             <h2 className="text-3xl font-bold mb-6 text-center">A better intake workflow isn't just about efficiency. It's about the quality of care.</h2>
            <ul className="space-y-4">
                <li className="flex items-start"><span className="text-green-400 mr-2">✔</span> Reduce administrative time by up to 70%</li>
                <li className="flex items-start"><span className="text-green-400 mr-2">✔</span> Improve the clarity and completeness of patient intake data</li>
                <li className="flex items-start"><span className="text-green-400 mr-2">✔</span> Provide a calm, professional patient experience from the start</li>
                <li className="flex items-start"><span className="text-green-400 mr-2">✔</span> Begin consultations with a clear, concise clinical picture</li>
            </ul>
        </section>

        {/* 7. DEMO FRAMING SECTION */}
        <section className="my-16 p-8 bg-gray-800 bg-opacity-40 rounded-lg max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">This is Not a Product—It's a Demonstration of Capability.</h2>
            <p className="dark:text-neutral-300">
            The workflow you are about to see is not a generic, one-size-fits-all template. It is a live demonstration of a custom system we build and adapt for individual clinics. Consider it a starting point. Your final workflow will be designed and implemented to meet the specific needs of your practice, your practitioners, and your patients.
            </p>
        </section>


        {/* 8. FINAL CTA */}
        <section className="text-center my-16">
            <h2 className="text-3xl md:text-4xl font-bold">Ready for a Workflow That Works for You?</h2>
            <p className="font-extralight text-base md:text-lg dark:text-neutral-200 py-4">Let's explore how a custom-built intake and documentation system can transform your practice.</p>
            <div className="flex justify-center gap-4 mt-4">
                <button className="bg-black dark:bg-white rounded-full w-fit text-white dark:text-black px-6 py-3 font-semibold">
                    Book a Private Walkthrough
                </button>
                <button className="border border-white rounded-full w-fit text-white px-6 py-3 font-semibold">
                    Discuss a Custom Solution
                </button>
            </div>
        </section>
      </motion.div>
    </AuroraBackground>)
  );
}
