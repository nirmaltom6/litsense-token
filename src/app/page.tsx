import Link from "next/link";
import { ArrowRight, Activity, Users, Clock, ShieldCheck, Zap, BarChart2, QrCode, ChevronRight, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Litsense — Healthcare Queue Management",
    description: "Surgical-precision token queue management for modern hospitals.",
};

const features = [
    {
        icon: <Zap className="h-6 w-6 text-primary-500" />,
        title: "Real-Time Tracking",
        desc: "Sub-5-second polling keeps every screen instantly synchronised — from reception to patient's phone.",
    },
    {
        icon: <Users className="h-6 w-6 text-accent" />,
        title: "Smart Priority Queuing",
        desc: "Our hybrid algorithm weights emergencies, appointment slots, and walk-ins to serve everyone fairly.",
    },
    {
        icon: <QrCode className="h-6 w-6 text-warning" />,
        title: "Patient Self-Serve",
        desc: "Each token generates a live-track link. Patients monitor their queue position from anywhere.",
    },
    {
        icon: <ShieldCheck className="h-6 w-6 text-primary-500" />,
        title: "Role-Based Dashboards",
        desc: "Secure terminals for Reception, Doctors, and Public Displays — each built for their exact workflow.",
    },
    {
        icon: <BarChart2 className="h-6 w-6 text-accent" />,
        title: "Live Analytics",
        desc: "At-a-glance stats: patients served, avg wait times, and active queue depth — no page reload needed.",
    },
    {
        icon: <Clock className="h-6 w-6 text-warning" />,
        title: "Wait Time Estimates",
        desc: "AI-calculated estimates per token help patients plan their time and reduce anxiety.",
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
    { value: "21", label: "API Endpoints" },
    { value: "3", label: "Role Dashboards" },
    { value: "∞", label: "Patients Supported" },
];

export default function Home() {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Navbar */}
            <header
                className="px-6 h-16 flex items-center justify-between border-b sticky top-0 z-50"
                style={{ background: "hsl(222,47%,9%,0.85)", backdropFilter: "blur(16px)" }}
            >
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tight">LITSENSE</span>
                </Link>
                <nav className="hidden md:flex gap-6 text-sm font-medium">
                    <a href="#features" className="text-muted hover:text-foreground transition-colors">Features</a>
                    <a href="#how-it-works" className="text-muted hover:text-foreground transition-colors">How it Works</a>
                    <a href="#stats" className="text-muted hover:text-foreground transition-colors">Stats</a>
                </nav>
                <div className="flex items-center gap-3">
                    <Link href="/reception" className="text-sm font-medium text-muted hover:text-foreground transition-colors hidden md:block">
                        Reception
                    </Link>
                    <Link
                        href="/doctor"
                        className="text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        Doctor Panel
                    </Link>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero */}
                <section className="relative px-6 py-28 md:py-40 overflow-hidden flex flex-col items-center text-center">
                    {/* Background blobs */}
                    <div
                        className="absolute inset-0 -z-10"
                        style={{
                            background:
                                "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(199,89%,48%,0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 60%, hsl(160,84%,39%,0.08), transparent)",
                        }}
                    />
                    <div
                        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full -z-10"
                        style={{ background: "hsl(199,89%,48%,0.05)", filter: "blur(80px)" }}
                    />

                    <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-500 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
                        <span className="h-2 w-2 rounded-full bg-accent animate-pulse"></span>
                        Healthcare-Grade Queue Management
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.05]">
                        Surgical Precision in{" "}
                        <span
                            className="text-transparent bg-clip-text"
                            style={{ backgroundImage: "linear-gradient(135deg, hsl(199,89%,60%), hsl(160,84%,55%))" }}
                        >
                            Queue Management
                        </span>
                    </h1>

                    <p className="mt-6 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
                        Eliminate waiting-room chaos. Our token system keeps patients informed, doctors efficient, and clinics running{" "}
                        <span className="text-foreground font-semibold">flawlessly</span>.
                    </p>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/reception"
                            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 hover:bg-primary-600 px-8 text-sm font-bold text-white shadow-lg transition-all hover:shadow-primary-500/30 hover:shadow-2xl hover:-translate-y-0.5"
                        >
                            Open Reception Dashboard
                        </Link>
                        <Link
                            href="/display"
                            className="inline-flex h-12 items-center justify-center rounded-lg border px-8 text-sm font-medium transition-all hover:border-white/20 hover:-translate-y-0.5"
                            style={{ background: "hsl(217,33%,17%)" }}
                        >
                            View Public Display <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </div>

                    {/* Quick access pills */}
                    <div className="mt-12 flex flex-wrap justify-center gap-3">
                        {[
                            { href: "/reception", label: "Reception", emoji: "🏥" },
                            { href: "/doctor", label: "Doctor Panel", emoji: "👨‍⚕️" },
                            { href: "/display", label: "Public Display", emoji: "📺" },
                        ].map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-2 text-sm font-medium text-muted border rounded-full px-4 py-2 hover:border-primary-500/40 hover:text-foreground transition-all"
                                style={{ background: "hsl(217,33%,17%,0.5)" }}
                            >
                                <span>{item.emoji}</span> {item.label} <ChevronRight className="h-3 w-3" />
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Stats */}
                <section id="stats" className="border-y py-12 px-6" style={{ background: "hsl(217,33%,14%)" }}>
                    <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((s) => (
                            <div key={s.label} className="text-center">
                                <p
                                    className="text-4xl font-black text-transparent bg-clip-text"
                                    style={{ backgroundImage: "linear-gradient(135deg, hsl(199,89%,60%), hsl(160,84%,55%))" }}
                                >
                                    {s.value}
                                </p>
                                <p className="text-sm text-muted mt-1 font-medium">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-primary-500 text-sm font-bold uppercase tracking-widest mb-3">Features</p>
                            <h2 className="text-3xl md:text-4xl font-black">Healthcare-Grade Infrastructure</h2>
                            <p className="text-muted mt-4 max-w-xl mx-auto">
                                Every component is purpose-built for the fast, high-stakes environment of a modern clinic.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((f, i) => (
                                <div
                                    key={i}
                                    className="card border transition-all duration-300 group hover:border-primary-500/40 hover:-translate-y-1"
                                    style={{ background: "linear-gradient(135deg, hsl(217,33%,17%), hsl(217,33%,15%))" }}
                                >
                                    <div
                                        className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 border"
                                        style={{ background: "hsl(217,33%,22%)" }}
                                    >
                                        {f.icon}
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary-500 transition-colors">{f.title}</h3>
                                    <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it Works */}
                <section id="how-it-works" className="py-24 px-6 border-t" style={{ background: "hsl(217,33%,14%)" }}>
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-accent text-sm font-bold uppercase tracking-widest mb-3">Process</p>
                            <h2 className="text-3xl md:text-4xl font-black">How It Works</h2>
                            <p className="text-muted mt-4 max-w-xl mx-auto">
                                From patient arrival to consultation completion — a seamless loop in six steps.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {steps.map((s, i) => (
                                <div key={i} className="relative group">
                                    <div
                                        className="card border hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1"
                                        style={{ background: "hsl(217,33%,17%)" }}
                                    >
                                        <p
                                            className="text-5xl font-black text-transparent bg-clip-text mb-4"
                                            style={{ backgroundImage: "linear-gradient(135deg, hsl(199,89%,48%,0.4), hsl(199,89%,48%,0.1))" }}
                                        >
                                            {s.num}
                                        </p>
                                        <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                                        <p className="text-muted text-sm leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 px-6 text-center relative overflow-hidden border-t">
                    <div
                        className="absolute inset-0 -z-10"
                        style={{
                            background: "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(199,89%,48%,0.08), transparent)",
                        }}
                    />
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-center mb-6">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className="h-5 w-5 text-warning"
                                    style={{ fill: "hsl(38,92%,50%)" }}
                                />
                            ))}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Ready to Modernise Your Clinic?</h2>
                        <p className="text-muted mb-10 text-lg">
                            Launch the Reception dashboard, add your doctors, and issue your first token in under a minute.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/reception"
                                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 hover:bg-primary-600 px-8 text-sm font-bold text-white shadow-lg transition-all hover:shadow-primary-500/30 hover:shadow-2xl hover:-translate-y-0.5"
                            >
                                Get Started — Reception
                            </Link>
                            <Link
                                href="/doctor"
                                className="inline-flex h-12 items-center justify-center rounded-lg border px-8 text-sm font-medium transition-all hover:-translate-y-0.5"
                                style={{ background: "hsl(217,33%,17%)" }}
                            >
                                Doctor Login <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-primary-500 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-black text-lg">LITSENSE</span>
                    </div>
                    <p className="text-sm text-muted text-center">
                        © 2026 Litsense Private Limited. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-muted">
                        <Link href="/reception" className="hover:text-foreground transition-colors">Reception</Link>
                        <Link href="/doctor" className="hover:text-foreground transition-colors">Doctor</Link>
                        <Link href="/display" className="hover:text-foreground transition-colors">Display</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
