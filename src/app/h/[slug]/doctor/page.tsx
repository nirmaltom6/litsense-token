"use client";

import { useTenant } from "@/lib/TenantContext";
import { useDoctors } from "@/hooks/useDoctors";
import { useTokenQueue } from "@/hooks/useTokenQueue";
import { fetchApi } from "@/lib/api";
import { Token } from "@/lib/types";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Activity, BellRing, CheckCircle2, UserX, SkipForward, Clock,
    ChevronLeft, RefreshCw, Timer, Stethoscope, AlertTriangle
} from "lucide-react";

function ElapsedTimer({ startedAt }: { startedAt?: string }) {
    const [elapsed, setElapsed] = useState("0:00");
    useEffect(() => {
        if (!startedAt) return;
        const update = () => {
            const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            setElapsed(`${m}:${s.toString().padStart(2, "0")}`);
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [startedAt]);
    return <span>{elapsed}</span>;
}

export default function TenantDoctorDashboard() {
    const { hospitalId, hospitalName, brandColor, loading: tenantLoading } = useTenant();
    const { doctors } = useDoctors(hospitalId);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const { queue, refresh, loading } = useTokenQueue(selectedDoctor, 3000, hospitalId);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const activeTokens = queue.filter((t) => ["waiting", "called", "serving"].includes(t.status));
    const currentToken = activeTokens.find((t) => t.status === "serving" || t.status === "called");
    const nextTokens = activeTokens.filter((t) => t._id !== currentToken?._id);
    const completedToday = queue.filter((t) => t.status === "completed").length;

    const handleAction = async (tokenId: string, action: string) => {
        setActionLoading(`${tokenId}-${action}`);
        try {
            await fetchApi(`/tokens/${tokenId}/${action}`, { method: "PUT" });
            refresh();
        } catch (err: any) {
            alert(`Action failed: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const callNext = () => {
        if (nextTokens[0]) handleAction(nextTokens[0]._id, "call");
    };

    if (tenantLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(222,47%,9%)" }}>
                <Activity className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="h-14 flex items-center px-6 border-b sticky top-0 z-30" style={{ background: "hsl(222,47%,9%,0.9)", backdropFilter: "blur(12px)" }}>
                <Link href="/login" className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mr-4">
                    <ChevronLeft className="h-4 w-4" />
                    <div className="h-6 w-6 rounded flex items-center justify-center" style={{ background: brandColor }}>
                        <Activity className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-black">{hospitalName}</span>
                </Link>
                <span className="text-muted text-sm mr-auto">/ Doctor</span>

                <select
                    className="select-field w-auto min-w-[220px] font-bold"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    style={{ color: selectedDoctor ? brandColor : undefined }}
                >
                    <option value="">— Select Your Account —</option>
                    {doctors.map((d) => (
                        <option key={d._id} value={d._id}>{d.name} — Room {d.roomNumber}</option>
                    ))}
                </select>
            </header>

            {!selectedDoctor ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 text-muted p-8">
                    <Stethoscope className="h-12 w-12 opacity-40" />
                    <h2 className="text-2xl font-bold text-foreground">Select Your Account</h2>
                    <p className="max-w-sm text-center">Pick your doctor account above to access the patient queue.</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0">
                    {/* Left: Current Patient */}
                    <aside className="border-r flex flex-col" style={{ background: "hsl(217,33%,14%)" }}>
                        <div className="grid grid-cols-2 gap-0 border-b">
                            {[
                                { label: "Waiting", value: nextTokens.length, color: brandColor },
                                { label: "Served", value: completedToday, color: "hsl(160,84%,55%)" },
                            ].map((s) => (
                                <div key={s.label} className="p-4 text-center border-r last:border-r-0">
                                    <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                                    <p className="text-xs text-muted mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 flex flex-col p-5 gap-4">
                            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Current Consultation</h3>
                            {currentToken ? (
                                <div className="rounded-xl border p-5" style={{ borderColor: brandColor + "60", background: brandColor + "10" }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs text-muted mb-1">Token</p>
                                            <h2 className="text-5xl font-black leading-none" style={{ color: brandColor }}>{currentToken.tokenNumber}</h2>
                                        </div>
                                        <span className="token-badge status-serving animate-pulse">{currentToken.status}</span>
                                    </div>
                                    <p className="text-lg font-semibold">{currentToken.patientName}</p>

                                    {currentToken.servingAt && (
                                        <div className="flex items-center gap-2 text-sm text-muted mt-3">
                                            <Timer className="h-4 w-4" style={{ color: brandColor }} />
                                            <span style={{ color: brandColor }}><ElapsedTimer startedAt={currentToken.servingAt} /></span>
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-2">
                                        {currentToken.status === "called" ? (
                                            <button onClick={() => handleAction(currentToken._id, "serving")} disabled={!!actionLoading} className="btn-accent w-full justify-center py-3">
                                                <Stethoscope className="h-4 w-4" /> Start Consultation
                                            </button>
                                        ) : (
                                            <button onClick={() => handleAction(currentToken._id, "complete")} disabled={!!actionLoading} className="btn-accent w-full justify-center py-3 font-bold">
                                                <CheckCircle2 className="h-5 w-5" /> Finish & Discharge
                                            </button>
                                        )}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => handleAction(currentToken._id, "skip")} disabled={!!actionLoading} className="btn-warning justify-center py-2 text-sm">
                                                <SkipForward className="h-4 w-4" /> Skip
                                            </button>
                                            <button onClick={() => handleAction(currentToken._id, "no-show")} disabled={!!actionLoading} className="btn-danger justify-center py-2 text-sm">
                                                <UserX className="h-4 w-4" /> No-Show
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 rounded-xl border border-dashed flex flex-col items-center justify-center py-10 text-muted">
                                    <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
                                    <p className="font-medium mb-1">No active patient</p>
                                    {nextTokens.length > 0 && (
                                        <button onClick={callNext} disabled={!!actionLoading} className="btn-primary py-3 px-6 mt-4">
                                            <BellRing className="h-5 w-5" /> Call Next
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Right: Queue */}
                    <main className="flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-xl font-bold">Queue — {hospitalName}</h2>
                            <button onClick={refresh} className="btn-ghost text-sm py-1.5">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {nextTokens.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-muted border border-dashed rounded-xl">
                                    <CheckCircle2 className="h-12 w-12 mb-4 opacity-30" />
                                    <p className="text-lg font-medium">Queue is clear</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {nextTokens.map((t, i) => (
                                        <div key={t._id} className="card border flex items-center gap-4 group transition-all hover:-translate-y-0.5">
                                            <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                                                style={{ background: i === 0 ? brandColor + "20" : "hsl(217,33%,22%)", color: i === 0 ? brandColor : undefined }}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-black text-lg" style={{ color: brandColor }}>{t.tokenNumber}</span>
                                                <span className="ml-2 font-semibold">{t.patientName}</span>
                                                {t.estimatedWaitTime != null && (
                                                    <span className="ml-3 text-xs text-warning"><Clock className="h-3 w-3 inline" /> ~{t.estimatedWaitTime}m</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleAction(t._id, "call")}
                                                disabled={!!actionLoading || !!currentToken}
                                                className="btn-primary text-xs py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                            >
                                                <BellRing className="h-3.5 w-3.5" /> Call
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            )}
        </div>
    );
}
