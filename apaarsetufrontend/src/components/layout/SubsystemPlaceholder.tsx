"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Clock, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SubsystemPlaceholderProps {
  portalTitle: string;
  portalDashboardHref: string;
  subsystemTitle: string;
  description: string;
  icon: LucideIcon;
  plannedRelease?: string;
  backendEndpoint?: string;
}

export default function SubsystemPlaceholder({
  portalTitle,
  portalDashboardHref,
  subsystemTitle,
  description,
  icon: Icon,
  plannedRelease = "Scheduled AICTE Regulatory Cycle",
  backendEndpoint,
}: SubsystemPlaceholderProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Wayfinding Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link
          href={portalDashboardHref}
          className="hover:text-indigo-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{portalTitle} Dashboard</span>
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-bold">{subsystemTitle}</span>
      </nav>

      {/* Main Presentation Container */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
        {/* Banner */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-8 py-10 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-xs text-white">
                <Icon className="h-6 w-6 text-indigo-300" />
              </span>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-400/20">
                  <Sparkles className="h-3 w-3" />
                  National Architecture Provisioned
                </span>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {subsystemTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 border border-white/10">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>{plannedRelease}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 sm:p-12">
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Subsystem Overview &amp; Regulatory Purpose
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>

            {backendEndpoint && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Backend Integration Wire
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <code className="rounded bg-white px-2.5 py-1 text-xs font-mono font-semibold text-indigo-700 border border-slate-200">
                    {backendEndpoint}
                  </code>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="h-3 w-3" /> Active in Spring Boot
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                href={portalDashboardHref}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Return to Dashboard
              </Link>

              <Link
                href="/api-status"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                <span>View System API Diagnostics</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

