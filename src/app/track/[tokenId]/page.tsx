"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { Token, Doctor } from "@/lib/types";
import { Activity, Clock, MapPin, User, RefreshCw, CheckCircle2, Stethoscope } from "lucide-react";

type TrackData = Token & { doctorId: Doctor; queuePosition?: number; peopleAhead?: number };

const STATUS_CONFIG = {
    waiting: { label: "Waiting", color: "text-muted", bg: "hsl(215,16%,47%,0.15)", border: "hsl(215,16%,47%,0.3)", step: 1 },
    called: { label: "Called", color: "text-warning", bg: "hsl(38,92%,50%,0.15)", border: "hsl(38,92%,50%,0.4)", step: 2 },
    serving: { label: "Serving", color: "text-accent", bg: "hsl(160,84%,39%,0.15)", border: "hsl(160,84%,39%,0.4)", step: 3 },
    completed: { label: "Complete", color: "text-primary-500", bg: "hsl(199,89%,48%,0.15)", border: "hsl(199,89%,48%,0.4)", step: 4 },
    "no-show": { label: "No Show", color: "text-danger", bg: "hsl(0,84%,60%,0.15)", border: "hsl(0,84%,60%,0.4)", step: 4 },
    cancelled: { label: "Cancelled", color: "text-danger", bg: "hsl(0,84%,60%,0.15)", border: "hsl(0,84%,60%,0.4)", step: 4 },
};

function ProgressRing({ position }: { position: number }) {
    // Simple animated ring using SVG
    const r = 54;
    const c = 2 * Math.PI * r;
    const fill = position > 0 ? Math.max(0, c - (position / 20) * c) : c;

    return (
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
            <svg width="160" height="160" className="-rotate-90">
                <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(217,33%,22%)" strokeWidth="10" />
                <circle
                    cx="80" cy="80" r={r} fill="none"
                    stroke="hsl(199,89%,48%)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c - fill}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-primary-500">{position}</span>
                <span className="text-xs text-muted font-medium">ahead</span>
            </div>
        </div>
    );
}

export default function TokenTracker() {
    const params = useParams();
    const tokenId = params.tokenId as string;

    const [token, setToken] = useState<TrackData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState("");

    const loadData = useCallback(async () => {
        try {
            const data = await fetchApi<TrackData>(`/tokens/${tokenId}/track`);
            setToken(data);
            setError(null);
            setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [tokenId]);

    useEffect(() => {
        loadData();
        const id = setInterval(loadData, 5000);
        return () => clearInterval(id);
    }, [loadData]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "hsl(222,47%,9%)" }}>
                <Activity className="h-10 w-10 text-primary-500 animate-spin mb-4" />
                <p className="text-muted text-sm">Loading your token status…</p>
            </div>
        );
    }

    if (error || !token) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ background: "hsl(222,47%,9%)" }}>
                <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ background: "hsl(0,84%,60%,0.1)" }}>
                    <Activity className="h-10 w-10 text-danger" />
                </div>
                <h1 className="text-2xl font-bold text-danger">Invalid Token</h1>
                <p className="text-muted max-w-xs">{error || "This token link is invalid or has expired."}</p>
                <Link href="/" className="btn-primary mt-4">Go to Home</Link>
            </div>
        );
    }

    const cfg = STATUS_CONFIG[token.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.waiting;
    const isCalled = token.status === "called" || token.status === "serving";
    const isComplete = token.status === "completed";
    const isNoShow = token.status === "no-show" || token.status === "cancelled";
    const people = token.peopleAhead ?? 0;
    const steps = ["Registered", "Called", "Serving", "Done"];

    return (
        <div
            className="min-h-screen flex flex-col font-sans"
            style={{ background: "hsl(222,47%,9%)", maxWidth: 480, margin: "0 auto" }}
        >
            {/* Header */}
            <header className="text-center py-6 border-b px-6" style={{ borderColor: "hsl(217,33%,22%)" }}>
                <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded bg-primary-500 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-black text-xl tracking-widest">LITSENSE</span>
                </div>
                <p className="text-xs text-muted uppercase tracking-widest">Live Token Tracker</p>
            </header>

            {/* Token Number Hero */}
            <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
                <p className="text-xs text-muted font-bold uppercase tracking-widest mb-4">Your Token</p>
                <div
                    className={`rounded-3xl px-12 py-6 mb-4 transition-all duration-700 ${isCalled ? "animate-glow" : ""}`}
                    style={{
                        background: cfg.bg,
                        border: `3px solid ${cfg.border}`,
                        transform: isCalled ? "scale(1.08)" : "scale(1)",
                    }}
                >
                    <span className={`text-8xl font-black leading-none ${cfg.color}`}>
                        {token.tokenNumber}
                    </span>
                </div>

                {/* Status Badge */}
                <span
                    className={`token-badge px-4 py-1.5 text-sm ${cfg.color} animate-fade-in`}
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                    {cfg.label}
                </span>

                <p className="text-lg font-semibold mt-3">{token.patientName}</p>
            </div>

            {/* Progress Stepper */}
            <div className="px-6 py-4">
                <div className="flex items-center justify-between relative">
                    <div
                        className="absolute top-4 left-4 right-4 h-0.5"
                        style={{ background: "hsl(217,33%,22%)" }}
                    />
                    <div
                        className="absolute top-4 left-4 h-0.5 transition-all duration-700"
                        style={{
                            background: "hsl(199,89%,48%)",
                            right: `${100 - ((cfg.step - 1) / 3) * 100}%`,
                        }}
                    />
                    {steps.map((step, i) => {
                        const done = cfg.step > i + 1;
                        const active = cfg.step === i + 1;
                        return (
                            <div key={step} className="flex flex-col items-center gap-1.5 relative z-10">
                                <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${done
                                            ? "bg-primary-500 text-white"
                                            : active
                                                ? "text-white"
                                                : "text-muted"
                                        }`}
                                    style={
                                        active
                                            ? { background: cfg.border, boxShadow: `0 0 12px ${cfg.border}` }
                                            : done
                                                ? {}
                                                : { background: "hsl(217,33%,22%)" }
                                    }
                                >
                                    {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                </div>
                                <span
                                    className={`text-xs font-medium ${active ? cfg.color : done ? "text-primary-500" : "text-muted"}`}
                                >
                                    {step}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content by State */}
            <div className="flex-1 px-6 pb-6 space-y-4">
                {isCalled ? (
                    /* Called / Serving State */
                    <div className="animate-slide-up space-y-4">
                        <div
                            className="rounded-2xl p-6 text-center"
                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                        >
                            <p className={`text-2xl font-black ${cfg.color} mb-1`}>
                                {token.status === "called" ? "🎉 It's Your Turn!" : "🩺 In Consultation"}
                            </p>
                            <p className="text-muted text-sm">
                                {token.status === "called"
                                    ? "Please proceed to the room immediately."
                                    : "Your consultation is in progress."}
                            </p>
                        </div>

                        {token.doctorId && (
                            <div className="card border space-y-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg"
                                        style={{ background: "hsl(217,33%,22%)", color: "hsl(199,89%,60%)" }}
                                    >
                                        {token.doctorId.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold">Dr. {token.doctorId.name}</p>
                                        <p className="text-xs text-muted">{token.doctorId.specialisation}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-lg font-bold">
                                    <MapPin className="h-5 w-5 text-primary-500" />
                                    Room <span className="text-primary-500 ml-1">{token.doctorId.roomNumber}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : isComplete ? (
                    /* Complete State */
                    <div className="flex flex-col items-center text-center py-8 animate-slide-up">
                        <div
                            className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
                            style={{ background: "hsl(199,89%,48%,0.15)" }}
                        >
                            <CheckCircle2 className="h-10 w-10 text-primary-500" />
                        </div>
                        <h2 className="text-2xl font-black text-primary-500 mb-2">Consultation Complete</h2>
                        <p className="text-muted">Thank you for visiting Litsense. We hope to see you healthy!</p>
                    </div>
                ) : isNoShow ? (
                    /* No-Show / Cancelled */
                    <div className="flex flex-col items-center text-center py-8">
                        <p className="text-2xl font-bold text-danger mb-2">Token {cfg.label}</p>
                        <p className="text-muted text-sm">Please visit the reception desk for assistance.</p>
                    </div>
                ) : (
                    /* Waiting State */
                    <div className="space-y-4 animate-fade-in">
                        {/* People Ahead Ring */}
                        <div className="card border flex flex-col items-center py-6">
                            <ProgressRing position={people} />
                            <p className="text-muted text-sm mt-3 font-medium">
                                {people === 0
                                    ? "You're next! Get ready."
                                    : `${people} ${people === 1 ? "person" : "people"} ahead of you`}
                            </p>
                        </div>

                        {/* Wait time & Doctor */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="card border text-center">
                                <Clock className="h-5 w-5 text-warning mx-auto mb-2" />
                                <p className="text-2xl font-black text-warning">
                                    {token.estimatedWaitTime != null ? `~${token.estimatedWaitTime}` : "--"}
                                </p>
                                <p className="text-xs text-muted mt-1">mins wait</p>
                            </div>
                            <div className="card border text-center">
                                <Stethoscope className="h-5 w-5 text-primary-500 mx-auto mb-2" />
                                <p className="text-sm font-bold leading-tight">
                                    Dr. {token.doctorId?.name ?? "--"}
                                </p>
                                <p className="text-xs text-muted mt-1">
                                    {token.doctorId?.specialisation ?? ""}
                                </p>
                            </div>
                        </div>

                        {token.doctorId?.roomNumber && (
                            <div className="card border flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-primary-500 shrink-0" />
                                <div>
                                    <p className="text-sm text-muted">Room Number</p>
                                    <p className="font-black text-xl text-primary-500">{token.doctorId.roomNumber}</p>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-muted text-center">
                            Stay in the waiting area. You'll be notified when called.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="text-center py-5 px-6 border-t space-y-2" style={{ borderColor: "hsl(217,33%,22%)" }}>
                <div className="flex items-center justify-center gap-2 text-xs text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Auto-updating every 5s
                    <button onClick={loadData} className="ml-2 hover:text-foreground text-muted transition-colors">
                        <RefreshCw className="h-3.5 w-3.5 inline" />
                    </button>
                </div>
                {lastUpdated && <p className="text-xs text-muted/60">Last updated {lastUpdated}</p>}
                <p className="text-xs text-muted">© 2026 Litsense Private Limited</p>
            </footer>
        </div>
    );
}
