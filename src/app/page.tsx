import Link from "next/link";
import { ArrowRight, Activity, Users, Clock, ShieldCheck, Zap, BarChart2, QrCode, ChevronRight, Star } from "lucide-react";
import Logo from "@/components/Logo";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";

const features = [
    {
        icon: <Zap className="h-6 w-6 text-primary-500" />,
        title: "Real-Time Tracking",
        desc: "Sub-5-second polling keeps every screen instantly synchronised — from reception to patient's phone.",
    },
    {
        icon: <Users className="h-6 w-6 text-primary-500" />,
        title: "Smart Priority Queuing",
        desc: "Our hybrid algorithm weights emergencies, appointment slots, and walk-ins to serve everyone fairly.",
    },
    {
        icon: <QrCode className="h-6 w-6 text-primary-500" />,
        title: "Patient Self-Serve",
        desc: "Each token generates a live-track link. Patients monitor their queue position from anywhere.",
    },
    {
        icon: <ShieldCheck className="h-6 w-6 text-primary-500" />,
        title: "Role-Based Dashboards",
        desc: "Secure terminals for Reception, Doctors, and Public Displays — each built for their exact workflow.",
    },
    {
        icon: <BarChart2 className="h-6 w-6 text-primary-500" />,
        title: "Clinical Analytics",
        desc: "At-a-glance stats: patients served, avg wait times, and active queue depth — no page reload needed.",
    },
    {
        icon: <Clock className="h-6 w-6 text-primary-500" />,
        title: "Wait Time Estimates",
        desc: "Engineering-grade estimates help patients plan their time and reduce anxiety.",
    },
];

const steps = [
    { num: "01", title: "Patient Arrives", desc: "Reception checks in the appointment or books a walk-in in seconds." },
    { num: "02", title: "Token Issued", desc: "System issues a numbered token with a priority rank and track link." },
    { num: "03", title: "Smart Queue", desc: "The hybrid algorithm assigns position based on priority and arrival." },
    { num: "04", title: "Display Updates", desc: "Lobby screens and patient phones show live token status in real-time." },
    { num: "05", title: "Doctor Controls", desc: "Doctors call, serve, delay or skip patients from their private panel." },
    { num: "06", title: "Completion", desc: "Token is closed, statistics are updated, and the cycle repeats." },
];

const stats = [
    { value: "< 5s", label: "Update Latency" },
    { value: "24/7", label: "Uptime Stability" },
    { value: "256-bit", label: "Encryption" },
    { value: "10k+", label: "Tokens/Day" },
];

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1">
                <Hero />

                {/* Stats */}
                <section id="stats" className="border-y py-12 px-6 bg-surface">
                    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((s) => (
                            <div key={s.label} className="text-center">
                                <p className="text-4xl font-black text-primary-500">
                                    {s.value}
                                </p>
                                <p className="text-sm text-muted mt-1 font-bold uppercase tracking-wider">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-24 px-6 bg-background">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-primary-500 text-sm font-bold uppercase tracking-widest mb-3">Litsense Healthineers</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Clinical-Grade Infrastructure</h2>
                            <p className="text-muted mt-4 max-w-xl mx-auto text-lg leading-relaxed">
                                Advanced clinical workflows by Litsense. Stable, secure, and infinitely scalable.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((f, i) => (
                                <div
                                    key={i}
                                    className="p-8 rounded-2xl border bg-card transition-all duration-300 group hover:border-primary-500 hover:shadow-xl"
                                >
                                    <div
                                        className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6 bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                                    >
                                        {f.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary-500 transition-colors">{f.title}</h3>
                                    <p className="text-muted leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Methodology / How it Works */}
                <section id="how-it-works" className="py-24 px-6 border-t bg-surface">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-20">
                            <p className="text-primary-500 text-sm font-bold uppercase tracking-widest mb-3">Our Methodology</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight">The Precision Lifecycle</h2>
                            <p className="text-muted mt-4 max-w-xl mx-auto text-lg leading-relaxed">
                                A systematic approach to patient flow management.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {steps.map((s, i) => (
                                <div key={i} className="relative group">
                                    <div className="absolute -top-10 -left-4 text-8xl font-black text-primary-500/5 select-none transition-all group-hover:text-primary-500/10">
                                        {s.num}
                                    </div>
                                    <div className="relative pt-4">
                                        <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                                        <p className="text-muted leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 px-6 text-center relative overflow-hidden border-t bg-background">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-center mb-6">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className="h-6 w-6 text-amber-400 fill-amber-400"
                                />
                            ))}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Secure Your Clinical Workflow</h2>
                        <p className="text-muted mb-12 text-xl leading-relaxed">
                            Join the pioneering hospitals using Litsense Healthineers to eliminate waiting-room congestion.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/reception"
                                className="inline-flex h-14 items-center justify-center rounded-full bg-primary-500 hover:bg-primary-600 px-10 text-lg font-bold text-white shadow-xl shadow-primary-500/20 transition-all hover:-translate-y-1"
                            >
                                Open Reception Hub
                            </Link>
                            <Link
                                href="/doctor"
                                className="inline-flex h-14 items-center justify-center rounded-full border border-border px-10 text-lg font-bold transition-all hover:bg-surface hover:-translate-y-1"
                            >
                                Doctor Login <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-16 px-6 bg-surface">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex flex-col items-center md:items-start gap-4 transition-all">
                            <Logo className="h-10" />
                            <p className="text-sm text-muted mt-2">
                                Pioneering anaesthesia solutions for the modern age.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 text-sm text-muted font-semibold">
                            <div className="flex flex-col gap-4">
                                <p className="text-foreground font-black uppercase tracking-widest text-[10px]">Portal</p>
                                <Link href="/reception" className="hover:text-primary-500 transition-colors">Reception</Link>
                                <Link href="/doctor" className="hover:text-primary-500 transition-colors">Doctor Panel</Link>
                                <Link href="/display" className="hover:text-primary-500 transition-colors">Public Monitor</Link>
                            </div>
                            <div className="flex flex-col gap-4">
                                <p className="text-foreground font-black uppercase tracking-widest text-[10px]">Company</p>
                                <a href="#" className="hover:text-primary-500 transition-colors">About Litsense</a>
                                <a href="#" className="hover:text-primary-500 transition-colors">Documentation</a>
                                <a href="#" className="hover:text-primary-500 transition-colors">Support</a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 text-[12px] text-muted font-medium">
                        <p>© 2026 Litsense Healthineers — A Division of Litsense Private Limited. All rights reserved.</p>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-foreground">Privacy Protocol</a>
                            <a href="#" className="hover:text-foreground">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
