"use client";

import Link from "next/link";
import { ArrowRight, Activity, Users, ClipboardList } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative px-6 py-24 md:py-32 overflow-hidden flex flex-col items-center text-center">
            {/* Background enhancement */}
            <div
                className="absolute inset-0 -z-10"
                style={{
                    background:
                        "radial-gradient(ellipse 80% 50% at 50% -20%, var(--teal-dim), transparent)",
                }}
            />

            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-8">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                Advanced Anaesthesia Solutions
            </div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tight max-w-5xl leading-[0.95] text-slate-900 dark:text-white">
                The Future of{" "}
                <span className="text-primary">
                    Clinical Workflow
                </span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
                Litsense Healthineers provides engineering-grade efficiency and surgical stability for modern anaesthesia departments.
            </p>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
                <Link
                    href="/doctor"
                    className="group relative flex flex-col items-center p-8 rounded-2xl border bg-card hover:border-primary-500 transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity className="h-24 w-24" />
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Doctor Login</h3>
                    <p className="text-sm text-muted mb-4">Secure workspace for clinical staff and specialists.</p>
                    <span className="text-sm font-bold text-primary inline-flex items-center gap-2">
                        Enter Workspace <ArrowRight className="h-4 w-4" />
                    </span>
                </Link>

                <Link
                    href="/reception"
                    className="group relative flex flex-col items-center p-8 rounded-2xl border bg-card hover:border-primary-500 transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="h-24 w-24" />
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Receptionist Login</h3>
                    <p className="text-sm text-muted mb-4">Terminal for patient check-ins and queue monitoring.</p>
                    <span className="text-sm font-bold text-primary inline-flex items-center gap-2">
                        Open Terminal <ArrowRight className="h-4 w-4" />
                    </span>
                </Link>
            </div>
        </section>
    );
}
