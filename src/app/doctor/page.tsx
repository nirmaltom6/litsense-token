"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDoctors } from "@/hooks/useDoctors";
import { useTokenQueue } from "@/hooks/useTokenQueue";
import { fetchApi } from "@/lib/api";
import { Token, Doctor } from "@/lib/types";
import {
  Activity, BellRing, CheckCircle2, UserX, SkipForward, Clock,
  ChevronLeft, RefreshCw, Timer, Stethoscope, AlertTriangle, LogOut
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

export default function DoctorDashboard() {
  const { logout } = useAuth();
  const { doctors } = useDoctors();
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const { queue, refresh, loading } = useTokenQueue(selectedDoctor, 3000);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(10);
  const [showDelayInput, setShowDelayInput] = useState<string | null>(null);

  const activeTokens = queue.filter((t) =>
    ["waiting", "called", "serving"].includes(t.status)
  );
  const currentToken = activeTokens.find(
    (t) => t.status === "serving" || t.status === "called"
  );
  const nextTokens = activeTokens.filter((t) => t._id !== currentToken?._id);
  const completedToday = queue.filter((t) => t.status === "completed").length;
  const avgWait = nextTokens.length > 0
    ? Math.round(nextTokens.reduce((a, t) => a + (t.estimatedWaitTime || 0), 0) / nextTokens.length)
    : 0;

  const doctor = doctors.find((d) => d._id === selectedDoctor);

  const handleAction = async (tokenId: string, action: string, extra?: object) => {
    setActionLoading(`${tokenId}-${action}`);
    try {
      if (action === "delay") {
        await fetchApi(`/tokens/${tokenId}/delay`, {
          method: "PUT",
          body: JSON.stringify({ delayMinutes }),
        });
        setShowDelayInput(null);
      } else {
        await fetchApi(`/tokens/${tokenId}/${action}`, { method: "PUT" });
      }
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header
        className="h-14 flex items-center px-6 border-b sticky top-0 z-30"
        style={{ background: "hsl(222,47%,9%,0.9)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-4 flex-1">
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-foreground transition-all hover:scale-[1.02]">
            <ChevronLeft className="h-4 w-4" />
            <Logo className="h-8" />
          </Link>
          <span className="text-muted text-sm">/ Clinical Panel</span>
        </div>

        {/* Doctor Account Selector */}
        <select
          id="doctor-account-selector"
          className="select-field w-auto min-w-[220px] font-bold"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          style={{ color: selectedDoctor ? "hsl(160,84%,55%)" : undefined }}
        >
          <option value="">— Select Your Account —</option>
          {doctors.map((d) => (
            <option key={d._id} value={d._id}>{d.name} — Room {d.roomNumber}</option>
          ))}
        </select>

        <button
          onClick={logout}
          className="p-2 text-muted hover:text-red-400 transition-colors ml-4"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {!selectedDoctor ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-muted p-8">
          <div
            className="h-24 w-24 rounded-full flex items-center justify-center animate-pulse-slow"
            style={{ background: "hsl(160,84%,39%,0.1)", border: "2px solid hsl(160,84%,39%,0.2)" }}
          >
            <Stethoscope className="h-12 w-12 text-accent opacity-60" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Doctor Login</h2>
            <p className="max-w-sm">Select your account from the dropdown above to access your patient queue and consultation tools.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-0">
          {/* ── Left Column ─────────────────────────────────── */}
          <aside className="border-r flex flex-col" style={{ background: "hsl(217,33%,14%)" }}>
            {/* Doctor Info */}
            {doctor && (
              <div className="p-5 border-b">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg text-accent"
                    style={{ background: "hsl(160,84%,39%,0.15)" }}
                  >
                    {doctor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">Dr. {doctor.name}</p>
                    <p className="text-xs text-muted">{doctor.specialisation} · Room {doctor.roomNumber}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold text-accent"
                    style={{ background: "hsl(160,84%,39%,0.15)" }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Online
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-0 border-b">
              {[
                { label: "Waiting", value: nextTokens.length, color: "text-primary-500" },
                { label: "Served", value: completedToday, color: "text-accent" },
                { label: "Avg Wait", value: avgWait ? `${avgWait}m` : "--", color: "text-warning" },
              ].map((s) => (
                <div key={s.label} className="p-4 text-center border-r last:border-r-0">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Current Patient */}
            <div className="flex-1 flex flex-col p-5 gap-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Current Consultation</h3>

              {currentToken ? (
                <div
                  className="rounded-xl border p-5 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, hsl(160,84%,39%,0.12), hsl(160,84%,39%,0.04))",
                    borderColor: "hsl(160,84%,39%,0.4)",
                  }}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-[0.04]">
                    <Stethoscope className="w-32 h-32" />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-muted mb-1">Token Number</p>
                      <h2 className="text-5xl font-black text-accent leading-none">{currentToken.tokenNumber}</h2>
                    </div>
                    <span
                      className="token-badge status-serving animate-pulse"
                      id="current-token-status"
                    >
                      {currentToken.status}
                    </span>
                  </div>
                  <p className="text-lg font-semibold mb-1">{currentToken.patientName}</p>
                  <p className="text-xs text-muted capitalize mb-4">{currentToken.priority} patient</p>

                  {/* Timer */}
                  {currentToken.servingAt && (
                    <div className="flex items-center gap-2 text-sm text-muted mb-4 font-medium">
                      <Timer className="h-4 w-4 text-accent" />
                      In consultation:{" "}
                      <span className="text-accent font-bold">
                        <ElapsedTimer startedAt={currentToken.servingAt} />
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    {currentToken.status === "called" ? (
                      <button
                        id="start-serving-btn"
                        onClick={() => handleAction(currentToken._id, "serving")}
                        disabled={!!actionLoading}
                        className="btn-accent w-full justify-center py-3"
                      >
                        {actionLoading === `${currentToken._id}-serving`
                          ? <RefreshCw className="h-4 w-4 animate-spin" />
                          : <Stethoscope className="h-4 w-4" />}
                        Patient Has Arrived — Start
                      </button>
                    ) : (
                      <button
                        id="complete-btn"
                        onClick={() => handleAction(currentToken._id, "complete")}
                        disabled={!!actionLoading}
                        className="btn-accent w-full justify-center py-3 text-base font-bold"
                      >
                        {actionLoading === `${currentToken._id}-complete`
                          ? <RefreshCw className="h-4 w-4 animate-spin" />
                          : <CheckCircle2 className="h-5 w-5" />}
                        Finish & Discharge
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id="skip-btn"
                        onClick={() => handleAction(currentToken._id, "skip")}
                        disabled={!!actionLoading}
                        className="btn-warning justify-center py-2 text-sm"
                      >
                        <SkipForward className="h-4 w-4" /> Skip
                      </button>
                      <button
                        id="no-show-btn"
                        onClick={() => handleAction(currentToken._id, "no-show")}
                        disabled={!!actionLoading}
                        className="btn-danger justify-center py-2 text-sm"
                      >
                        <UserX className="h-4 w-4" /> No-Show
                      </button>
                    </div>

                    {/* Delay */}
                    {showDelayInput === currentToken._id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={delayMinutes}
                          onChange={(e) => setDelayMinutes(Number(e.target.value))}
                          className="input-field w-20 text-center"
                        />
                        <span className="text-sm text-muted">min</span>
                        <button
                          id="confirm-delay-btn"
                          onClick={() => handleAction(currentToken._id, "delay")}
                          className="btn-ghost text-sm py-1.5 flex-1 justify-center"
                        >
                          <Clock className="h-4 w-4" /> Delay
                        </button>
                        <button onClick={() => setShowDelayInput(null)} className="text-muted text-sm">✕</button>
                      </div>
                    ) : (
                      <button
                        id="delay-btn"
                        onClick={() => setShowDelayInput(currentToken._id)}
                        className="btn-ghost w-full justify-center py-2 text-sm"
                      >
                        <Clock className="h-4 w-4" /> Delay Consultation
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="flex-1 rounded-xl border border-dashed flex flex-col items-center justify-center py-10 text-muted"
                >
                  <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-base font-medium mb-1">No active patient</p>
                  <p className="text-sm mb-6">Call the next patient to begin.</p>
                  {nextTokens.length > 0 && (
                    <button
                      id="call-next-btn-empty"
                      onClick={callNext}
                      disabled={!!actionLoading}
                      className="btn-primary py-3 px-6"
                    >
                      <BellRing className="h-5 w-5" />
                      Call Next Patient
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Call Next - always accessible when no current token */}
            {currentToken && nextTokens.length > 0 && (
              <div className="p-4 border-t">
                <button
                  id="call-next-btn"
                  onClick={callNext}
                  disabled={!!actionLoading || !!currentToken}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-40"
                >
                  <BellRing className="h-5 w-5" />
                  Call Next ({nextTokens[0]?.tokenNumber})
                </button>
              </div>
            )}
          </aside>

          {/* ── Right Column: Queue ─────────────────────────── */}
          <main className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-bold">Upcoming Queue</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">{nextTokens.length} waiting</span>
                <button
                  id="refresh-doctor-queue"
                  onClick={refresh}
                  className="btn-ghost text-sm py-1.5"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {nextTokens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted border border-dashed rounded-xl">
                  <CheckCircle2 className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Queue is clear!</p>
                  <p className="text-sm mt-1">No more patients waiting.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nextTokens.map((t, index) => {
                    const isEmergency = t.priority === "emergency";
                    return (
                      <div
                        key={t._id}
                        id={`queue-item-${t._id}`}
                        className={`card border group transition-all hover:-translate-y-0.5 flex items-center gap-4 ${isEmergency ? "border-danger/30" : ""
                          }`}
                        style={isEmergency ? { background: "hsl(0,84%,60%,0.05)" } : {}}
                      >
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                          style={{
                            background: index === 0 ? "hsl(199,89%,48%,0.15)" : "hsl(217,33%,22%)",
                            color: index === 0 ? "hsl(199,89%,60%)" : undefined,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-lg text-primary-500">{t.tokenNumber}</span>
                            <span className="font-semibold">{t.patientName}</span>
                            {isEmergency && (
                              <span className="token-badge priority-emergency flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Emergency
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`token-badge priority-${t.priority}`}>{t.priority}</span>
                            {t.estimatedWaitTime != null && (
                              <span className="text-xs text-warning flex items-center gap-1">
                                <Clock className="h-3 w-3" /> ~{t.estimatedWaitTime} min
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            id={`call-btn-${t._id}`}
                            onClick={() => handleAction(t._id, "call")}
                            disabled={!!actionLoading || !!currentToken}
                            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                          >
                            <BellRing className="h-3.5 w-3.5" /> Call
                          </button>
                          {showDelayInput === t._id ? (
                            <div className="flex gap-1 items-center">
                              <input
                                type="number" min={1} max={60}
                                value={delayMinutes}
                                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                                className="input-field w-16 text-center py-1 text-xs"
                              />
                              <span className="text-xs text-muted">m</span>
                              <button
                                onClick={() => handleAction(t._id, "delay")}
                                className="btn-ghost text-xs py-1 px-2"
                              >✓</button>
                              <button onClick={() => setShowDelayInput(null)} className="text-muted text-xs">✕</button>
                            </div>
                          ) : (
                            <button
                              id={`delay-queue-btn-${t._id}`}
                              onClick={() => setShowDelayInput(t._id)}
                              className="btn-ghost text-xs py-1.5 px-3"
                            >
                              <Clock className="h-3.5 w-3.5" /> Delay
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
