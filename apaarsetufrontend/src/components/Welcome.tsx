// 'use client'
// import React from 'react'
// import { motion } from "motion/react"
// import { ArrowRight } from 'lucide-react'
// type propType={
//     nextStep:(s:number)=>void
// }
// function Welcome({nextStep}:propType) {
//   return (
//     <div className='flex flex-col items-center justify-center min-h-screen text-center p-6'>
//       <motion.div
//       initial={{
//         opacity:0,
//         y:-20
//       }}
//       animate={{
//         opacity:1,
//         y:0
//       }}
//       transition={{
//         duration:2
//       }}
//       >
//         <h1 className='text-4xl md:text-5xl font-extrabold text-green-700'>apaarSetu</h1>
//       </motion.div>


//       <motion.p
//         initial={{
//         opacity:0,
//         y:10
//       }}
//       animate={{
//         opacity:1,
//         y:0
//       }}
//       transition={{
//         duration:2,
//         delay:0.3
//       }}>
//         Add Description
//       </motion.p>
// {/* --------------------------------------- */}
//       <motion.button
//               initial={{
//         opacity:0,
//         y:20
//       }}
//       animate={{
//         opacity:1,
//         y:0
//       }}
//       transition={{
//         duration:0.6,
//         delay:0.6
//       }}
//       className='inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-2xl shadow-md transition-all duration-200 mt-10'
//       onClick={()=>nextStep(2)}>
//         Next
//         <ArrowRight size={18} />
//       </motion.button>

//       <div className="mt-8 flex flex-col items-center gap-1">
//         <a
//           href="/api-status"
//           className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-full hover:bg-indigo-100 transition"
//         >
//           <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
//           Full 44+ API Diagnostic Suite (49 Endpoints Verified) &rarr;
//         </a>
//       </div>
//     </div>
//   )
// }

// export default Welcome
// -----------------------------------------------------------
// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { ArrowRight } from "lucide-react";
// import { Noto_Sans_Devanagari, Plus_Jakarta_Sans } from "next/font/google";

// // Devanagari face for "अपार", Latin face for "Setu" (both heavy so they sit well together).
// const hindi = Noto_Sans_Devanagari({
//   subsets: ["devanagari"],
//   weight: ["800"],
//   display: "swap",
// });
// const latin = Plus_Jakarta_Sans({
//   subsets: ["latin"],
//   weight: ["800"],
//   display: "swap",
// });

// /* Loading stages: shown while the bar fills, then the Next button appears. */
// const STAGES = [
//   { at: 0, text: "Starting apaarSetu..." },
//   { at: 900, text: "Connecting to the API..." },
//   { at: 1800, text: "Preparing your workspace..." },
// ];
// const READY_AT = 2700; // ms, keep in sync with the 2.7s bar animation below

// export default function HomePage() {
//   const [stage, setStage] = useState(0);
//   const [ready, setReady] = useState(false);
//   const [apiUp, setApiUp] = useState<boolean | null>(null);

//   // Runs on every page load or reload, so the splash plays each time.
//   useEffect(() => {
//     const timers = [
//       ...STAGES.slice(1).map((s, i) => setTimeout(() => setStage(i + 1), s.at)),
//       setTimeout(() => setReady(true), READY_AT),
//     ];

//     fetch("/api/v1/health", { cache: "no-store" })
//       .then((r) => setApiUp(r.ok))
//       .catch(() => setApiUp(false));

//     return () => timers.forEach(clearTimeout);
//   }, []);

//   return (
//     <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-6 text-slate-900">
//       {/* soft indigo glow, same palette as the admin pages */}
//       <div
//         aria-hidden
//         className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,#e0e7ff_0%,transparent_70%)]"
//       />

//       <div className="relative flex flex-col items-center text-center">
//         {/* ------------------------------- Logo ------------------------------- */}
//         <div className="splash-pop flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-600 shadow-lg shadow-indigo-200 sm:h-28 sm:w-28">
//           <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16" fill="none" aria-hidden>
//             {/* arch of the bridge */}
//             <path
//               d="M6 42 C 16 14, 48 14, 58 42"
//               stroke="white"
//               strokeWidth="4"
//               strokeLinecap="round"
//               pathLength={1}
//               className="splash-draw"
//             />
//             {/* deck */}
//             <path
//               d="M4 44 H60"
//               stroke="white"
//               strokeWidth="4"
//               strokeLinecap="round"
//               pathLength={1}
//               className="splash-draw splash-delay-1"
//             />
//             {/* hangers */}
//             {[18, 26, 32, 38, 46].map((x, i) => (
//               <path
//                 key={x}
//                 d={`M${x} 44 V${x === 32 ? 22 : x === 26 || x === 38 ? 24 : 29}`}
//                 stroke="white"
//                 strokeWidth="2.5"
//                 strokeLinecap="round"
//                 className="splash-fade"
//                 style={{ animationDelay: `${0.9 + i * 0.08}s` }}
//               />
//             ))}
//           </svg>
//         </div>

//         {/* ----------------------------- Wordmark ----------------------------- */}
//         <h1
//           className="mt-8 flex items-baseline justify-center gap-1 text-7xl leading-none tracking-tight sm:text-8xl md:text-9xl"
//           aria-label="अपार Setu"
//         >
//           <span className={`${hindi.className} splash-rise text-slate-900`} lang="hi">
//             अपार
//           </span>
//           <span
//             className={`${latin.className} splash-rise text-indigo-600`}
//             style={{ animationDelay: "0.25s" }}
//           >
//             Setu
//           </span>
//         </h1>

//         <p
//           className="splash-rise mt-5 max-w-md text-base text-slate-600 sm:text-lg"
//           style={{ animationDelay: "0.5s" }}
//         >
//           Connecting institutions, students and verified APAAR records.
//         </p>

//         {/* ------------------------- Loading / Next area ------------------------- */}
//         <div className="mt-10 flex h-28 w-72 flex-col items-center sm:w-80">
//           {!ready ? (
//             <div role="status" aria-live="polite" className="w-full">
//               <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
//                 <div className="splash-bar h-full rounded-full bg-indigo-600" />
//               </div>
//               <p className="mt-3 text-sm text-slate-600">{STAGES[stage].text}</p>
//             </div>
//           ) : (
//             <div className="splash-rise flex flex-col items-center">
//               <Link
//                 href="/login"
//                 className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
//               >
//                 Next <ArrowRight className="h-5 w-5" />
//               </Link>
//               {apiUp === false && (
//                 <p className="mt-3 text-sm text-red-600">
//                   API unreachable (Port 8081). You can still continue.
//                 </p>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Diagnostic suite link */}
//         <Link
//           href="/diagnostics"
//           className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
//         >
//           <span
//             className={`h-2 w-2 rounded-full ${
//               apiUp === false ? "bg-red-500" : apiUp ? "bg-emerald-500" : "bg-slate-300"
//             }`}
//           />
//           Full 44+ API Diagnostic Suite (49 Endpoints Verified) →
//         </Link>
//       </div>

//       <style jsx global>{`
//         @keyframes splash-rise {
//           from { opacity: 0; transform: translateY(18px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes splash-pop {
//           from { opacity: 0; transform: scale(0.8); }
//           to { opacity: 1; transform: scale(1); }
//         }
//         @keyframes splash-draw {
//           from { stroke-dashoffset: 1; }
//           to { stroke-dashoffset: 0; }
//         }
//         @keyframes splash-fade {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }
//         @keyframes splash-bar {
//           from { width: 0%; }
//           to { width: 100%; }
//         }
//         .splash-rise { opacity: 0; animation: splash-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }
//         .splash-pop { animation: splash-pop 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }
//         .splash-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: splash-draw 0.9s ease-out 0.3s forwards; }
//         .splash-delay-1 { animation-delay: 0.8s; }
//         .splash-fade { opacity: 0; animation: splash-fade 0.4s ease-out forwards; }
//         .splash-bar { width: 0%; animation: splash-bar 2.7s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

//         @media (prefers-reduced-motion: reduce) {
//           .splash-rise, .splash-pop, .splash-fade { animation: none; opacity: 1; transform: none; }
//           .splash-draw { animation: none; stroke-dashoffset: 0; }
//           .splash-bar { animation: none; width: 100%; }
//         }
//       `}</style>
//     </main>
//   );
// }

// ---------------------------------------------------------

// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { ArrowRight } from "lucide-react";
// import { Noto_Sans_Devanagari, Plus_Jakarta_Sans } from "next/font/google";

// type Props = {
//   nextStep: (step: number) => void;
// };

// const hindi = Noto_Sans_Devanagari({
//   subsets: ["devanagari"],
//   weight: ["800"],
//   display: "swap",
// });

// const latin = Plus_Jakarta_Sans({
//   subsets: ["latin"],
//   weight: ["800"],
//   display: "swap",
// });

// const STAGES = [
//   { at: 0, text: "Starting apaarSetu..." },
//   { at: 900, text: "Connecting to the API..." },
//   { at: 1800, text: "Preparing your workspace..." },
// ];

// const READY_AT = 2700;

// export default function HomePage({ nextStep }: Props) {
//   const [stage, setStage] = useState(0);
//   const [ready, setReady] = useState(false);
//   const [apiUp, setApiUp] = useState<boolean | null>(null);

//   useEffect(() => {
//     const timers = [
//       ...STAGES.slice(1).map((s, i) =>
//         setTimeout(() => setStage(i + 1), s.at)
//       ),
//       setTimeout(() => setReady(true), READY_AT),
//     ];

//     fetch("/api/v1/health", { cache: "no-store" })
//       .then((r) => setApiUp(r.ok))
//       .catch(() => setApiUp(false));

//     return () => timers.forEach(clearTimeout);
//   }, []);

//   return (
//     <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-6 text-slate-900">
//       {/* Background glow */}
//       <div
//         aria-hidden
//         className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,#e0e7ff_0%,transparent_70%)]"
//       />

//       <div className="relative flex flex-col items-center text-center">
//         {/* Logo */}
//         <div className="splash-pop flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-600 shadow-lg shadow-indigo-200 sm:h-28 sm:w-28">
//           <svg
//             viewBox="0 0 64 64"
//             className="h-14 w-14 sm:h-16 sm:w-16"
//             fill="none"
//             aria-hidden="true"
//           >
//             {/* Bridge arch */}
//             <path
//               d="M6 42 C 16 14, 48 14, 58 42"
//               stroke="white"
//               strokeWidth="4"
//               strokeLinecap="round"
//               pathLength={1}
//               className="splash-draw"
//             />

//             {/* Bridge deck */}
//             <path
//               d="M4 44 H60"
//               stroke="white"
//               strokeWidth="4"
//               strokeLinecap="round"
//               pathLength={1}
//               className="splash-draw splash-delay-1"
//             />

//             {/* Bridge hangers */}
//             {[18, 26, 32, 38, 46].map((x, i) => (
//               <path
//                 key={x}
//                 d={`M${x} 44 V${x === 32 ? 22 : x === 26 || x === 38 ? 24 : 29}`}
//                 stroke="white"
//                 strokeWidth="2.5"
//                 strokeLinecap="round"
//                 className="splash-fade"
//                 style={{ animationDelay: `${0.9 + i * 0.08}s` }}
//               />
//             ))}
//           </svg>
//         </div>

//         {/* Wordmark */}
//         <h1
//           className="mt-8 flex items-baseline justify-center gap-1 text-7xl leading-none tracking-tight sm:text-8xl md:text-9xl"
//           aria-label="अपार Setu"
//         >
//           <span
//             className={`${hindi.className} splash-rise text-slate-900`}
//             lang="hi"
//           >
//             अपार
//           </span>

//           <span
//             className={`${latin.className} splash-rise text-indigo-600`}
//             style={{ animationDelay: "0.25s" }}
//           >
//             Setu
//           </span>
//         </h1>

//         <p
//           className="splash-rise mt-5 max-w-md text-base text-slate-600 sm:text-lg"
//           style={{ animationDelay: "0.5s" }}
//         >
//           Connecting institutions, students and verified APAAR records.
//         </p>

//         {/* Loading / Next button */}
//         <div className="mt-10 flex h-28 w-72 flex-col items-center sm:w-80">
//           {!ready ? (
//             <div role="status" aria-live="polite" className="w-full">
//               <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
//                 <div className="splash-bar h-full rounded-full bg-indigo-600" />
//               </div>

//               <p className="mt-3 text-sm text-slate-600">
//                 {STAGES[stage].text}
//               </p>
//             </div>
//           ) : (
//             <div className="splash-rise flex flex-col items-center">
//               <button
//                 type="button"
//                 onClick={() => nextStep(2)}
//                 className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-200 transition-colors hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
//               >
//                 Next <ArrowRight className="h-5 w-5" />
//               </button>

//               {apiUp === false && (
//                 <p className="mt-3 text-sm text-red-600">
//                   API unreachable (Port 8081). You can still continue.
//                 </p>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Diagnostic suite link */}
//         <Link
//           href="/diagnostics"
//           className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
//         >
//           <span
//             className={`h-2 w-2 rounded-full ${
//               apiUp === false
//                 ? "bg-red-500"
//                 : apiUp
//                   ? "bg-emerald-500"
//                   : "bg-slate-300"
//             }`}
//           />

//           Full 44+ API Diagnostic Suite (49 Endpoints Verified) →
//         </Link>
//       </div>

//       {/* Animations */}
//       <style jsx global>{`
//         @keyframes splash-rise {
//           from {
//             opacity: 0;
//             transform: translateY(18px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes splash-pop {
//           from {
//             opacity: 0;
//             transform: scale(0.8);
//           }
//           to {
//             opacity: 1;
//             transform: scale(1);
//           }
//         }

//         @keyframes splash-draw {
//           from {
//             stroke-dashoffset: 1;
//           }
//           to {
//             stroke-dashoffset: 0;
//           }
//         }

//         @keyframes splash-fade {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }

//         @keyframes splash-bar {
//           from {
//             width: 0%;
//           }
//           to {
//             width: 100%;
//           }
//         }

//         .splash-rise {
//           opacity: 0;
//           animation: splash-rise 0.7s
//             cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
//         }

//         .splash-pop {
//           animation: splash-pop 0.6s
//             cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
//         }

//         .splash-draw {
//           stroke-dasharray: 1;
//           stroke-dashoffset: 1;
//           animation: splash-draw 0.9s ease-out 0.3s forwards;
//         }

//         .splash-delay-1 {
//           animation-delay: 0.8s;
//         }

//         .splash-fade {
//           opacity: 0;
//           animation: splash-fade 0.4s ease-out forwards;
//         }

//         .splash-bar {
//           width: 0%;
//           animation: splash-bar 2.7s
//             cubic-bezier(0.4, 0, 0.2, 1) forwards;
//         }

//         @media (prefers-reduced-motion: reduce) {
//           .splash-rise,
//           .splash-pop,
//           .splash-fade {
//             animation: none;
//             opacity: 1;
//             transform: none;
//           }

//           .splash-draw {
//             animation: none;
//             stroke-dashoffset: 0;
//           }

//           .splash-bar {
//             animation: none;
//             width: 100%;
//           }
//         }
//       `}</style>
//     </main>
//   );
// }


// -----------------With no api---------------------

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Noto_Sans_Devanagari, Plus_Jakarta_Sans } from "next/font/google";

type Props = {
  nextStep: (s: number) => void;
};

const hindi = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["800"],
  display: "swap",
});

const latin = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
});

export default function HomePage({ nextStep }: Props) {
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
                d={`M${x} 44 V${
                  x === 32 ? 22 : x === 26 || x === 38 ? 24 : 29
                }`}
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
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Next
          <ArrowRight size={20} />
        </motion.button>

        {/* Diagnostic suite link */}
        <Link
          href="/diagnostics"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Full 44+ API Diagnostic Suite (49 Endpoints Verified) →
        </Link>
      </div>
    </main>
  );
}
