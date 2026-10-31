"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

type Props = {
  nextStep: (s: number) => void;
};

// Offline-safe system font fallbacks ensuring reliable Docker, CI/CD, and production container builds
const hindi = { className: "font-sans font-extrabold" };
const latin = { className: "font-sans font-extrabold" };

export default function Welcome({ nextStep }: Props) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-6 text-slate-900">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,#e0e7ff_0%,transparent_70%)]"
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-600 shadow-lg shadow-indigo-200 sm:h-28 sm:w-28"
        >
          <svg
            viewBox="0 0 64 64"
            className="h-14 w-14 sm:h-16 sm:w-16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 42 C16 14, 48 14, 58 42"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <path
              d="M4 44 H60"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {[18, 26, 32, 38, 46].map((x) => (
              <path
                key={x}
                d={`M${x} 44 V${x === 32 ? 22 : x === 26 || x === 38 ? 24 : 29}`}
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))}
          </svg>
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-8 flex items-baseline justify-center gap-1 text-7xl leading-none tracking-tight sm:text-8xl md:text-9xl"
          aria-label="अपार Setu"
        >
          <span className={`${hindi.className} text-slate-900`} lang="hi">
            अपार
          </span>

          <span className={`${latin.className} text-indigo-600`}>
            Setu
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-5 max-w-md text-base text-slate-600 sm:text-lg"
        >
          Connecting institutions, students and verified APAAR records.
        </motion.p>

        {/* Next button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          type="button"
          onClick={() => nextStep(2)}
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
        >
          Next
          <ArrowRight size={20} />
        </motion.button>
      </div>
    </main>
  );
}
