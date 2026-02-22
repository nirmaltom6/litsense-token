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
    ChevronLeft, RefreshCw, Timer, Stethoscope, AlertTriangle,
    Search, XCircle, LogOut
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";

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
    const { logout } = useAuth();
    const { hospitalId, hospitalName, brandColor, loading: tenantLoading } = useTenant();
    const { doctors } = useDoctors(hospitalId);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const { queue, refresh, loading } = useTokenQueue(selectedDoctor, 3000, hospitalId);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeTokens = queue.filter((t) => ["waiting", "called", "serving"].includes(t.status));
    const currentToken = activeTokens.find((t) => t.status === "serving" || t.status === "called");
    const nextTokens = activeTokens.filter((t) => t._id !== currentToken?._id);
    const completedToday = queue.filter((t) => t.status === "completed").length;

    const handleAction = async (tokenId: string, action: string) => {
        setActionLoading(`${tokenId}-${action}`);
        setError(null);
        try {
            await fetchApi(`/tokens/${tokenId}/${action}`, { method: "PUT" });
            refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const callNext = () => {
        if (nextTokens[0]) handleAction(nextTokens[0]._id, "call");
    };

    if (tenantLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a1628]">
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl opacity-20" style={{ background: brandColor }} />
                    <Activity className="h-10 w-10 animate-spin relative" style={{ color: brandColor }} />
                </div>
                <p className="mt-4 text-muted animate-pulse font-medium tracking-wide">Initialising Terminal...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="h-14 flex items-center px-4 md:px-6 border-b sticky top-0 z-30" style={{ background: "hsl(222,47%,12%,0.95)", backdropFilter: "blur(16px)" }}>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 mr-2 md:hidden text-muted hover:text-foreground transition-colors"
                >
                    <Activity className="h-5 w-5" />
                </button>

                <Link href="/login" className="hidden sm:flex items-center gap-2 text-muted hover:text-foreground transition-colors mr-4 shrink-0 transition-all hover:scale-[1.02]">
                    <ChevronLeft className="h-4 w-4" />
                    <Logo className="h-8" />
                    <span className="font-black text-sm hidden lg:inline border-l pl-3 ml-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>{hospitalName}</span>
                </Link>
                <span className="h-4 w-px bg-white/10 mx-3 hidden lg:block"></span>
                <span className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] hidden lg:inline shrink-0">Workspace / Doctor</span>

                <div className="flex-1 max-w-sm mx-4 relative hidden md:block group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-teal transition-colors" />
                    <input
                        type="text"
                        placeholder="Search queue..."
                        className="input-field search-input py-1.5 text-xs bg-black/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="ml-auto">
                    <select
                        className="select-field w-auto min-w-[200px] text-xs py-1.5 font-bold"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        style={{ color: selectedDoctor ? brandColor : undefined }}
                    >
                        <option value="">— Select Account —</option>
                        {doctors.map((d) => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                <div className="ml-4 flex items-center">
                    <button
                        onClick={logout}
                        className="p-2 text-muted hover:text-red-400 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </header>

            {!selectedDoctor ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                    <div className="empty-state-card border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-16 shadow-2xl">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 blur-3xl opacity-20 bg-teal animate-pulse" />
                            <Stethoscope className="empty-state-icon h-24 w-24 relative" />
                        </div>
                        <h2 className="text-4xl font-black text-foreground mb-4 tracking-tighter">Welcome, Doctor</h2>
                        <p className="max-w-md text-muted text-lg leading-relaxed">Please select your account from the dropdown above to manage your daily patient queue.</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
                    {/* Left: Current Patient */}
                    <aside
                        className={`fixed inset-y-0 left-0 z-40 w-80 bg-[#1e2c3e] border-r flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                        style={{ background: "rgba(20, 33, 49, 0.65)", backdropFilter: "blur(20px)" }}
                    >
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
                                <div className="flex-1 empty-state-card py-12 border-dashed">
                                    <AlertTriangle className="empty-state-icon h-12 w-12" />
                                    <p className="empty-state-title text-base">No patient in consultation</p>
                                    {nextTokens.length > 0 ? (
                                        <button onClick={callNext} disabled={!!actionLoading} className="btn-call-next mt-6 !text-sm !py-3 !px-6 !min-h-0 !w-auto">
                                            <BellRing className="h-5 w-5" /> Call Next Patient
                                        </button>
                                    ) : (
                                        <p className="empty-state-desc">The queue is currently empty.</p>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs animate-shake mt-4">
                                    {error}
                                </div>
                            )}
                        </div>

                        {sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="md:hidden absolute top-4 -right-12 p-2 bg-black/50 rounded-full text-white"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        )}
                    </aside>

                    {/* Right: Queue */}
                    <main className="flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-xl font-bold">Queue — {hospitalName}</h2>
                            <button onClick={refresh} className="btn-ghost text-sm py-1.5">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            <div className="mb-6 md:hidden">
                                <div className="relative group">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-teal transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search queue..."
                                        className="input-field search-input text-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {nextTokens.filter(t => t.patientName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                <div className="empty-state-card py-24">
                                    <CheckCircle2 className="empty-state-icon" />
                                    <h3 className="empty-state-title">{searchQuery ? "No matches" : "Queue is clear"}</h3>
                                    <p className="empty-state-desc">
                                        {searchQuery ? `We couldn't find "${searchQuery}" in the queue.` : "All patients have been served or the queue has not started yet."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {nextTokens
                                        .filter(t => t.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((t, i) => (
                                            <div key={t._id} className="p-4 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center gap-4 group transition-all hover:-translate-y-0.5">
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                                                        style={{ background: i === 0 ? brandColor + "20" : "hsl(217,33%,22%)", color: i === 0 ? brandColor : undefined }}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-black text-xl md:text-2xl" style={{ color: brandColor }}>{t.tokenNumber}</span>
                                                            <span className="font-bold truncate text-base md:text-lg">{t.patientName}</span>
                                                        </div>
                                                        {t.estimatedWaitTime != null && (
                                                            <span className="text-xs text-warning flex items-center gap-1 mt-0.5 font-semibold">
                                                                <Clock className="h-3 w-3" /> ~{t.estimatedWaitTime}m
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAction(t._id, "call")}
                                                    disabled={!!actionLoading || !!currentToken}
                                                    className="btn-primary w-full sm:w-auto text-sm py-2 px-6 shadow-lg shadow-primary-500/10 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                                >
                                                    <BellRing className="h-4 w-4" /> Call Patient
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
