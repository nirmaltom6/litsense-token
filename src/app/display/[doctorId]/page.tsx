"use client";

import { useTokenQueue } from "@/hooks/useTokenQueue";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Doctor } from "@/lib/types";
import { Activity, LayoutGrid } from "lucide-react";

export default function SingleDoctorDisplay() {
    const params = useParams();
    const doctorId = params.doctorId as string;
    const { queue } = useTokenQueue(doctorId, 3000);
    const [currentTime, setCurrentTime] = useState("");

    const activeTokens = queue.filter((t) => t.status === "called" || t.status === "serving");
    const waitingTokens = queue.filter((t) => t.status === "waiting");
    const completedToday = queue.filter((t) => t.status === "completed").length;

    const currentToken = activeTokens[0];
    const doctor =
        currentToken && typeof currentToken.doctorId === "object"
            ? (currentToken.doctorId as Doctor)
            : undefined;

    useEffect(() => {
        const update = () =>
            setCurrentTime(
                new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
            );
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans select-none">
            {/* Header */}
            <header
                className="px-10 py-5 border-b border-white/10 flex justify-between items-center"
                style={{ background: "hsl(0,0%,4%)" }}
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-primary-500 tracking-tighter leading-none">LITSENSE</h1>
                        {doctor && (
                            <p className="text-sm text-muted font-bold uppercase tracking-widest">
                                Dr. {doctor.name} · Room {doctor.roomNumber}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <p className="text-4xl font-black tabular-nums">{currentTime}</p>
                    <Link
                        href="/display"
                        className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
                    >
                        <LayoutGrid className="h-4 w-4" /> All Doctors
                    </Link>
                </div>
            </header>

            {/* Main: Giant Token Display */}
            <main className="flex-1 flex p-8 gap-8 overflow-hidden">
                {/* Left: Massive token */}
                <div className="flex-[3] flex flex-col items-center justify-center">
                    {currentToken ? (
                        <div className="text-center">
                            <p className="text-2xl font-bold text-muted uppercase tracking-[0.3em] mb-6">
                                {currentToken.status === "called" ? "🔔 Please Enter" : "Now Serving"}
                            </p>

                            {/* Giant Token Number */}
                            <div
                                className="rounded-3xl px-16 py-12 mb-8 inline-block animate-glow"
                                style={{
                                    background: "linear-gradient(135deg, hsl(199,89%,48%,0.15), hsl(199,89%,48%,0.05))",
                                    border: "3px solid hsl(199,89%,48%)",
                                }}
                            >
                                <span
                                    className="font-black text-primary-500"
                                    style={{ fontSize: "clamp(6rem, 20vw, 16rem)", lineHeight: 1 }}
                                >
                                    {currentToken.tokenNumber}
                                </span>
                            </div>

                            {currentToken.status === "called" && (
                                <div
                                    className="inline-block px-10 py-4 rounded-full font-black text-4xl animate-pulse"
                                    style={{
                                        background: "hsl(160,84%,39%,0.15)",
                                        color: "hsl(160,84%,55%)",
                                        border: "2px solid hsl(160,84%,39%,0.4)",
                                    }}
                                >
                                    PLEASE ENTER THE ROOM
                                </div>
                            )}

                            {doctor && (
                                <div className="mt-10 flex gap-6 justify-center">
                                    <div
                                        className="px-8 py-4 rounded-2xl text-center"
                                        style={{ background: "hsl(0,0%,8%)", border: "1px solid hsl(0,0%,15%)" }}
                                    >
                                        <p className="text-muted text-sm mb-1">Room</p>
                                        <p className="text-white font-black text-5xl">{doctor.roomNumber}</p>
                                    </div>
                                    <div
                                        className="px-8 py-4 rounded-2xl text-center"
                                        style={{ background: "hsl(0,0%,8%)", border: "1px solid hsl(0,0%,15%)" }}
                                    >
                                        <p className="text-muted text-sm mb-1">Doctor</p>
                                        <p className="text-white font-bold text-2xl">Dr. {doctor.name}</p>
                                        <p className="text-muted text-sm mt-1">{doctor.specialisation}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center">
                            <div
                                className="h-40 w-40 mx-auto rounded-full mb-8 flex items-center justify-center animate-pulse-slow"
                                style={{
                                    background: "hsl(160,84%,39%,0.08)",
                                    border: "3px dashed hsl(160,84%,39%,0.2)",
                                }}
                            >
                                <Activity className="h-20 w-20 text-accent opacity-40" />
                            </div>
                            <p className="text-5xl font-black text-muted">Doctor Available</p>
                            <p className="text-2xl text-muted/60 mt-4">Awaiting next patient…</p>
                        </div>
                    )}
                </div>

                {/* Right: Queue */}
                <div
                    className="w-80 rounded-3xl border border-white/10 p-8 flex flex-col shrink-0"
                    style={{ background: "hsl(0,0%,6%)" }}
                >
                    <h2 className="text-2xl font-bold text-muted uppercase tracking-widest mb-6">Up Next</h2>
                    <div className="space-y-4 flex-1 overflow-hidden">
                        {waitingTokens.length === 0 ? (
                            <p className="text-muted text-center py-8 text-lg">No one waiting.</p>
                        ) : (
                            waitingTokens.slice(0, 7).map((token, i) => (
                                <div
                                    key={token._id}
                                    id={`waiting-${token._id}`}
                                    className="border border-white/5 p-5 rounded-2xl flex justify-between items-center"
                                    style={{ background: i === 0 ? "hsl(199,89%,48%,0.08)" : "hsl(0,0%,9%)" }}
                                >
                                    <span
                                        className={`font-bold ${i === 0 ? "text-4xl text-primary-500" : "text-3xl text-white"}`}
                                    >
                                        {token.tokenNumber}
                                    </span>
                                    {token.estimatedWaitTime != null && (
                                        <span
                                            className={`font-bold text-base ${i === 0 ? "text-warning" : "text-muted"}`}
                                        >
                                            ~{token.estimatedWaitTime}m
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Stats Footer */}
            <footer
                className="px-10 py-3 border-t border-white/10 flex justify-between items-center text-sm"
                style={{ background: "hsl(0,0%,4%)" }}
            >
                <div className="flex items-center gap-6 text-muted">
                    <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-accent animate-pulse" /> Live
                    </span>
                    <span>Waiting: <strong className="text-primary-500">{waitingTokens.length}</strong></span>
                    <span>Served today: <strong className="text-accent">{completedToday}</strong></span>
                </div>
                <Link href="/display" className="text-muted hover:text-foreground transition-colors text-sm">
                    ← All Doctors View
                </Link>
            </footer>
        </div>
    );
}
