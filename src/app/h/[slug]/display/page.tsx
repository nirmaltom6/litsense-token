"use client";

import { useTenant } from "@/lib/TenantContext";
import { useDoctors } from "@/hooks/useDoctors";
import { useTokenQueue } from "@/hooks/useTokenQueue";
import { Token, Doctor } from "@/lib/types";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

export default function TenantDisplay() {
    const { hospitalId, hospitalName, brandColor, loading: tenantLoading } = useTenant();
    const { doctors } = useDoctors(hospitalId);
    const { queue } = useTokenQueue(undefined, 3000, hospitalId);
    const [currentTime, setCurrentTime] = useState("");

    const activeTokens = queue.filter((t) => t.status === "called" || t.status === "serving");
    const waitingTokens = queue.filter((t) => t.status === "waiting");

    useEffect(() => {
        const update = () => setCurrentTime(
            new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
        );
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    if (tenantLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Activity className="h-10 w-10 animate-spin" style={{ color: brandColor }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans select-none">
            <header className="px-10 py-5 border-b border-white/10 flex justify-between items-center" style={{ background: "hsl(0,0%,4%)" }}>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: brandColor }}>
                        <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter" style={{ color: brandColor }}>{hospitalName}</h1>
                        <p className="text-xs text-muted uppercase tracking-widest">Token Display</p>
                    </div>
                </div>
                <p className="text-4xl font-black tabular-nums">{currentTime}</p>
            </header>

            <main className="flex-1 flex p-8 gap-8 overflow-hidden">
                {/* Now Serving */}
                <div className="flex-[2] flex flex-col gap-5">
                    <h2 className="text-2xl font-bold text-muted uppercase tracking-widest">Now Serving</h2>
                    {activeTokens.length === 0 ? (
                        <div className="flex-1 rounded-3xl border border-dashed border-white/10 flex items-center justify-center">
                            <p className="text-3xl font-bold text-muted">Awaiting next patient…</p>
                        </div>
                    ) : (
                        activeTokens.slice(0, 3).map((token) => {
                            const doctor = typeof token.doctorId === "object" ? (token.doctorId as Doctor) : doctors.find((d) => d._id === token.doctorId);
                            return (
                                <div key={token._id} className="rounded-3xl border p-8 flex justify-between items-center" style={{ borderColor: brandColor + "60", background: brandColor + "10" }}>
                                    <div>
                                        <p className="text-sm font-bold text-muted uppercase tracking-widest mb-2">
                                            {token.status === "called" ? "🔔 Please Proceed" : "Now Serving"}
                                        </p>
                                        <h2 className="text-8xl font-black" style={{ color: brandColor }}>{token.tokenNumber}</h2>
                                    </div>
                                    {doctor && (
                                        <div className="text-right">
                                            <div className="px-6 py-3 rounded-xl font-black text-4xl text-black" style={{ background: "white" }}>Rm {doctor.roomNumber}</div>
                                            <p className="text-muted font-bold text-xl mt-3">Dr. {doctor.name}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Next in Line */}
                <div className="flex-1 rounded-3xl border border-white/10 p-8 flex flex-col" style={{ background: "hsl(0,0%,6%)" }}>
                    <h2 className="text-2xl font-bold text-muted uppercase tracking-widest mb-6">Next in Line</h2>
                    <div className="space-y-3 flex-1 overflow-hidden">
                        {waitingTokens.length === 0 ? (
                            <p className="text-muted text-center py-8 text-lg">Queue is empty.</p>
                        ) : (
                            waitingTokens.slice(0, 9).map((token, i) => {
                                const doctor = typeof token.doctorId === "object" ? (token.doctorId as Doctor) : doctors.find((d) => d._id === token.doctorId);
                                return (
                                    <div key={token._id} className="border border-white/5 p-4 rounded-2xl flex justify-between items-center"
                                        style={{ background: i === 0 ? brandColor + "10" : "hsl(0,0%,9%)" }}>
                                        <span className={`font-bold ${i === 0 ? "text-3xl" : "text-2xl"}`} style={{ color: i === 0 ? brandColor : "white" }}>
                                            {token.tokenNumber}
                                        </span>
                                        {doctor && <span className="text-sm text-muted">Dr. {doctor.name}</span>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            <footer className="px-10 py-4 border-t border-white/10 flex justify-between items-center text-sm" style={{ background: "hsl(0,0%,4%)" }}>
                <div className="flex items-center gap-6 text-muted">
                    <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: brandColor }} />
                    <span>Live • {waitingTokens.length} waiting</span>
                </div>
                <Link href="/login" className="text-muted hover:text-foreground">← Switch Hospital</Link>
            </footer>
        </div>
    );
}
