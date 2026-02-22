"use client";

import { useDoctors } from "@/hooks/useDoctors";
import { useTokenQueue } from "@/hooks/useTokenQueue";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Token, Doctor } from "@/lib/types";
import { Activity } from "lucide-react";

function PulsingToken({ token, doctor, size = "large" }: { token: Token; doctor?: Doctor; size?: "large" | "small" }) {
    return (
        <div
            className={`rounded-3xl border transition-all duration-700 flex justify-between items-center gap-6 ${size === "large"
                    ? "p-8 bg-primary-500/10 border-primary-500 animate-glow"
                    : "p-6 border-white/10"
                }`}
            style={size === "large" ? { background: "linear-gradient(135deg, hsl(199,89%,48%,0.12), hsl(199,89%,48%,0.05))" } : { background: "hsl(217,33%,17%,0.5)" }}
        >
            <div>
                <p className="text-sm font-bold text-muted uppercase tracking-widest mb-2">
                    {token.status === "called" ? "🔔 Please Proceed" : "Now Serving"}
                </p>
                <h2
                    className={`font-black leading-none ${size === "large" ? "text-9xl text-primary-500" : "text-6xl text-white"}`}
                >
                    {token.tokenNumber}
                </h2>
                {token.status === "called" && size === "large" && (
                    <span
                        className="inline-block mt-4 px-6 py-2 font-black text-2xl rounded-full animate-pulse"
                        style={{ background: "hsl(160,84%,39%,0.2)", color: "hsl(160,84%,55%)", border: "1px solid hsl(160,84%,39%,0.4)" }}
                    >
                        ENTER ROOM ↑
                    </span>
                )}
            </div>
            {doctor && (
                <div className="text-right shrink-0">
                    <p className="text-muted text-lg mb-2">Proceed to</p>
                    <div
                        className="px-6 py-3 rounded-xl font-black text-5xl text-black"
                        style={{ background: "white" }}
                    >
                        Rm {doctor.roomNumber}
                    </div>
                    <p className="text-muted font-bold text-xl mt-3">Dr. {doctor.name}</p>
                    <p className="text-muted text-sm">{doctor.specialisation}</p>
                </div>
            )}
        </div>
    );
}

export default function PublicDisplay() {
    const { doctors } = useDoctors();
    const { queue } = useTokenQueue(undefined, 3000);
    const [currentTime, setCurrentTime] = useState("");
    const [currentDate, setCurrentDate] = useState("");

    const activeTokens = queue.filter((t) => t.status === "called" || t.status === "serving");
    const waitingTokens = queue.filter((t) => t.status === "waiting");
    const completedToday = queue.filter((t) => t.status === "completed").length;

    useEffect(() => {
        const update = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
            setCurrentDate(now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }));
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans select-none">
            {/* Header */}
            <header className="px-10 py-5 border-b border-white/10 flex justify-between items-center" style={{ background: "hsl(0,0%,4%)" }}>
                <Link href="/" className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-primary-500 tracking-tighter leading-none">LITSENSE</h1>
                        <p className="text-xs text-muted uppercase tracking-[0.2em] font-bold">Registration & Triage</p>
                    </div>
                </Link>
                <div className="text-right">
                    <p className="text-4xl font-black tabular-nums">{currentTime}</p>
                    <p className="text-sm text-muted mt-0.5">{currentDate}</p>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex p-8 gap-8 overflow-hidden">
                {/* Left: Now Serving */}
                <div className="flex-[2] flex flex-col gap-5">
                    <h2 className="text-2xl font-bold text-muted uppercase tracking-widest">Now Serving</h2>

                    {activeTokens.length === 0 ? (
                        <div
                            className="flex-1 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-4"
                            style={{ background: "hsl(217,33%,10%,0.5)" }}
                        >
                            <div
                                className="h-24 w-24 rounded-full flex items-center justify-center animate-pulse-slow"
                                style={{ background: "hsl(199,89%,48%,0.08)", border: "2px dashed hsl(199,89%,48%,0.2)" }}
                            >
                                <Activity className="h-12 w-12 text-primary-500 opacity-40" />
                            </div>
                            <p className="text-3xl font-bold text-muted">Awaiting next patient…</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5 flex-1">
                            {activeTokens.slice(0, 1).map((token) => {
                                const doctor =
                                    typeof token.doctorId === "object"
                                        ? (token.doctorId as Doctor)
                                        : doctors.find((d) => d._id === token.doctorId);
                                return <PulsingToken key={token._id} token={token} doctor={doctor} size="large" />;
                            })}
                            {activeTokens.slice(1, 3).map((token) => {
                                const doctor =
                                    typeof token.doctorId === "object"
                                        ? (token.doctorId as Doctor)
                                        : doctors.find((d) => d._id === token.doctorId);
                                return <PulsingToken key={token._id} token={token} doctor={doctor} size="small" />;
                            })}
                        </div>
                    )}
                </div>

                {/* Right: Next in Line */}
                <div
                    className="flex-1 rounded-3xl border border-white/10 p-8 flex flex-col"
                    style={{ background: "hsl(0,0%,6%)" }}
                >
                    <h2 className="text-2xl font-bold text-muted uppercase tracking-widest mb-6">Next in Line</h2>
                    <div className="space-y-3 flex-1 overflow-hidden">
                        {waitingTokens.length === 0 ? (
                            <p className="text-muted text-center py-8 text-lg">Queue is empty.</p>
                        ) : (
                            waitingTokens.slice(0, 9).map((token, i) => {
                                const doctor =
                                    typeof token.doctorId === "object"
                                        ? (token.doctorId as Doctor)
                                        : doctors.find((d) => d._id === token.doctorId);
                                return (
                                    <div
                                        key={token._id}
                                        id={`waiting-token-${token._id}`}
                                        className="border border-white/5 p-4 rounded-2xl flex justify-between items-center"
                                        style={{ background: i === 0 ? "hsl(199,89%,48%,0.06)" : "hsl(0,0%,9%,0.8)" }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-muted w-5 text-right">{i + 1}</span>
                                            <span
                                                className={`font-bold text-right ${i === 0 ? "text-3xl text-primary-500" : "text-2xl text-white"}`}
                                            >
                                                {token.tokenNumber}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            {doctor && <span className="text-sm text-muted block">Dr. {doctor.name}</span>}
                                            {token.estimatedWaitTime != null && (
                                                <span className="text-sm font-bold text-warning">
                                                    ~{token.estimatedWaitTime} min
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            {/* Stats Footer */}
            <footer className="px-10 py-4 border-t border-white/10 flex justify-between items-center text-sm" style={{ background: "hsl(0,0%,4%)" }}>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                        <span className="text-muted">Live • Updating every 3s</span>
                    </div>
                    <span className="text-muted">Completed today: <strong className="text-accent">{completedToday}</strong></span>
                    <span className="text-muted">Currently waiting: <strong className="text-primary-500">{waitingTokens.length}</strong></span>
                    <span className="text-muted">Active consultations: <strong className="text-warning">{activeTokens.length}</strong></span>
                </div>
                <div className="flex items-center gap-4 text-muted">
                    <Link href="/display" className="hover:text-foreground transition-colors underline-offset-2 hover:underline">All Doctors</Link>
                    <Link href="/" className="hover:text-foreground transition-colors">← Home</Link>
                </div>
            </footer>
        </div>
    );
}
