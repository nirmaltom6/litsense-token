"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useDoctors } from "@/hooks/useDoctors";
import { useTokenQueue } from "@/hooks/useTokenQueue";
import { fetchApi } from "@/lib/api";
import { Appointment, Token, Doctor } from "@/lib/types";
import {
    Activity, PlusCircle, Users, ClipboardList, RefreshCw,
    CheckCircle2, XCircle, Ticket, ChevronLeft, Clock, UserPlus,
    AlertCircle, Phone, CalendarDays, LogOut
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";

type AppointmentWithDoctor = Appointment & { doctorId: Doctor };

const STATUS_STYLES: Record<string, string> = {
    scheduled: "status-waiting",
    "checked-in": "status-serving",
    cancelled: "status-no-show",
    "no-show": "status-no-show",
    completed: "status-complete",
};

export default function ReceptionDashboard() {
    const { logout } = useAuth();
    const { doctors, loading: docsLoading } = useDoctors();
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const { queue, refresh: refreshQueue } = useTokenQueue(selectedDoctor, 5000);

    // Appointments
    const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
    const [apptLoading, setApptLoading] = useState(false);

    // Issue walk-in token form
    const [patientName, setPatientName] = useState("");
    const [tokenPriority, setTokenPriority] = useState<"walk-in" | "emergency">("walk-in");
    const [issuing, setIssuing] = useState(false);
    const [issuedToken, setIssuedToken] = useState<Token | null>(null);

    // Book walk-in appointment form
    const [showWalkInForm, setShowWalkInForm] = useState(false);
    const [walkInName, setWalkInName] = useState("");
    const [walkInPhone, setWalkInPhone] = useState("");
    const [bookingDoctor, setBookingDoctor] = useState("");
    const [bookingTime, setBookingTime] = useState("");
    const [booking, setBooking] = useState(false);

    // Action state
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [tab, setTab] = useState<"queue" | "appointments" | "book">("queue");

    // ── Fetch appointments ────────────────────────────────────
    const fetchAppointments = useCallback(async () => {
        if (!selectedDoctor) { setAppointments([]); return; }
        setApptLoading(true);
        try {
            const data = await fetchApi<AppointmentWithDoctor[]>(
                `/appointments?doctorId=${selectedDoctor}&date=${selectedDate}`
            );
            setAppointments(data);
        } catch { setAppointments([]); }
        finally { setApptLoading(false); }
    }, [selectedDoctor, selectedDate]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    // ── Issue Walk-In Token ───────────────────────────────────
    const issueToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctor || !patientName) return;
        setIssuing(true);
        try {
            const data = await fetchApi<{ token: Token }>("/tokens/issue", {
                method: "POST",
                body: JSON.stringify({ doctorId: selectedDoctor, patientName, priority: tokenPriority }),
            });
            setIssuedToken((data as any).token ?? data);
            setPatientName("");
            refreshQueue();
        } catch (err: any) {
            alert(`Failed: ${err.message}`);
        } finally { setIssuing(false); }
    };

    // ── Appointment Issue Token ───────────────────────────────
    const issueFromAppointment = async (appt: AppointmentWithDoctor) => {
        const key = `issue-${appt._id}`;
        setActionLoading(key);
        try {
            // First check-in
            await fetchApi(`/appointments/${appt._id}/checkin`, { method: "PUT" });
            // Then issue token
            const data = await fetchApi<{ token: Token }>("/tokens/issue", {
                method: "POST",
                body: JSON.stringify({
                    doctorId: typeof appt.doctorId === "object" ? appt.doctorId._id : appt.doctorId,
                    patientName: appt.patientName,
                    priority: "appointment",
                    appointmentId: appt._id,
                }),
            });
            setIssuedToken((data as any).token ?? data);
            fetchAppointments();
            refreshQueue();
        } catch (err: any) {
            alert(`Failed: ${err.message}`);
        } finally { setActionLoading(null); }
    };

    // ── Cancel Appointment ────────────────────────────────────
    const cancelAppointment = async (id: string) => {
        if (!confirm("Cancel this appointment?")) return;
        setActionLoading(`cancel-${id}`);
        try {
            await fetchApi(`/appointments/${id}/cancel`, { method: "PUT" });
            fetchAppointments();
        } catch (err: any) { alert(`Failed: ${err.message}`); }
        finally { setActionLoading(null); }
    };

    // ── Book Walk-In Appointment ──────────────────────────────
    const bookWalkIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bookingDoctor || !walkInName) return;
        setBooking(true);
        try {
            await fetchApi<Appointment>("/appointments", {
                method: "POST",
                body: JSON.stringify({
                    patientName: walkInName,
                    patientPhone: walkInPhone,
                    doctorId: bookingDoctor,
                    appointmentDate: selectedDate,
                    appointmentTime: bookingTime || "00:00",
                    source: "walk-in",
                }),
            });
            setWalkInName(""); setWalkInPhone(""); setBookingTime("");
            setShowWalkInForm(false);
            fetchAppointments();
        } catch (err: any) { alert(`Failed: ${err.message}`); }
        finally { setBooking(false); }
    };

    const activeQueue = queue.filter((t) => ["waiting", "called", "serving"].includes(t.status));
    const servingToken = activeQueue.find((t) => t.status === "serving" || t.status === "called");

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Top Navbar */}
            <header className="h-14 flex items-center px-6 border-b sticky top-0 z-30" style={{ background: "hsl(222,47%,9%,0.9)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center gap-4 flex-1">
                    <Link href="/" className="flex items-center gap-2 text-muted hover:text-foreground transition-all hover:scale-[1.02]">
                        <ChevronLeft className="h-4 w-4" />
                        <Logo className="h-8" />
                    </Link>
                    <span className="text-muted text-sm">/ Reception</span>
                </div>

                {/* Doctor Selector */}
                <div className="flex items-center gap-3">
                    <select
                        id="doctor-selector"
                        className="select-field w-auto min-w-[200px] text-sm"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                    >
                        <option value="">— Select Doctor —</option>
                        {doctors.map((d) => (
                            <option key={d._id} value={d._id}>{d.name} (Rm {d.roomNumber})</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        id="date-picker"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="input-field w-auto text-sm"
                        style={{ colorScheme: "dark" }}
                    />

                    <button
                        onClick={logout}
                        className="p-2 text-muted hover:text-red-400 transition-colors ml-2"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </header>

            <div className="flex h-[calc(100vh-3.5rem)]">
                {/* ── Left Sidebar ─────────────────────────────────────── */}
                <aside className="w-80 border-r flex flex-col" style={{ background: "hsl(217,33%,14%)" }}>
                    {/* Currently Serving Banner */}
                    {servingToken && (
                        <div
                            className="p-4 border-b"
                            style={{ background: "linear-gradient(135deg, hsl(160,84%,39%,0.15), hsl(160,84%,39%,0.05))", borderColor: "hsl(160,84%,39%,0.3)" }}
                        >
                            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Now Serving</p>
                            <div className="flex items-center justify-between">
                                <p className="text-3xl font-black text-accent">{servingToken.tokenNumber}</p>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{servingToken.patientName}</p>
                                    <p className="text-xs text-muted capitalize">{servingToken.status}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Issue Token Form */}
                    <div className="p-5 border-b">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                            <Ticket className="h-4 w-4" /> Issue Walk-In Token
                        </h2>
                        <form onSubmit={issueToken} className="space-y-3">
                            {!selectedDoctor && (
                                <div className="flex items-start gap-2 p-2 rounded-md text-xs text-warning" style={{ background: "hsl(38,92%,50%,0.1)" }}>
                                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                    Select a doctor from the top bar first.
                                </div>
                            )}
                            <div>
                                <label className="block text-xs text-muted font-medium mb-1">Patient Name</label>
                                <input
                                    id="patient-name-input"
                                    type="text"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g. Anil Sharma"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted font-medium mb-1">Priority</label>
                                <select
                                    id="priority-select"
                                    value={tokenPriority}
                                    onChange={(e) => setTokenPriority(e.target.value as "walk-in" | "emergency")}
                                    className="select-field"
                                >
                                    <option value="walk-in">Walk-In (Normal)</option>
                                    <option value="emergency">Emergency (Priority)</option>
                                </select>
                            </div>
                            <button
                                id="issue-token-btn"
                                type="submit"
                                disabled={issuing || !selectedDoctor || !patientName}
                                className="btn-primary w-full justify-center py-2.5"
                            >
                                {issuing ? <><RefreshCw className="h-4 w-4 animate-spin" /> Issuing…</> : <><Ticket className="h-4 w-4" /> Issue Token</>}
                            </button>
                        </form>
                    </div>

                    {/* Issued Token Receipt */}
                    {issuedToken && (
                        <div
                            id="token-receipt"
                            className="mx-4 mt-4 rounded-xl border p-4 text-center animate-slide-up"
                            style={{ background: "hsl(199,89%,48%,0.08)", borderColor: "hsl(199,89%,48%,0.3)" }}
                        >
                            <p className="text-xs text-muted font-medium mb-1">Token Issued ✓</p>
                            <p className="text-5xl font-black text-primary-500 animate-token">{issuedToken.tokenNumber}</p>
                            <p className="text-sm font-semibold mt-2">{issuedToken.patientName}</p>
                            <p className="token-badge priority-walk-in mt-2 inline-block">{issuedToken.priority}</p>
                            <p className="text-xs text-muted mt-3">Direct patient to the waiting area.</p>
                            <Link
                                href={`/track/${issuedToken._id}`}
                                target="_blank"
                                className="block mt-3 text-xs text-primary-500 hover:text-primary-600 underline"
                            >
                                Open patient tracker link ↗
                            </Link>
                            <button
                                onClick={() => setIssuedToken(null)}
                                className="mt-3 text-xs text-muted hover:text-foreground transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    <div className="flex-1" />
                    <div className="p-4 border-t text-center text-xs text-muted">
                        Auto-refreshing every 5s • {activeQueue.length} in queue
                    </div>
                </aside>

                {/* ── Main Content ─────────────────────────────────────── */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b px-6 pt-2 gap-1" style={{ background: "hsl(217,33%,14%)" }}>
                        {[
                            { key: "queue", label: "Live Queue", icon: <Users className="h-4 w-4" /> },
                            { key: "appointments", label: "Today's Appointments", icon: <ClipboardList className="h-4 w-4" /> },
                            { key: "book", label: "Book Walk-In", icon: <UserPlus className="h-4 w-4" /> },
                        ].map((t) => (
                            <button
                                key={t.key}
                                id={`tab-${t.key}`}
                                onClick={() => setTab(t.key as typeof tab)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                                    ? "border-primary-500 text-primary-500"
                                    : "border-transparent text-muted hover:text-foreground"
                                    }`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* ── QUEUE TAB ─────────────────────────────────── */}
                        {tab === "queue" && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">
                                        Live Queue {selectedDoctor ? "" : <span className="text-sm text-muted font-normal">(All Doctors)</span>}
                                    </h2>
                                    <button
                                        id="refresh-queue-btn"
                                        onClick={refreshQueue}
                                        className="btn-ghost text-sm py-1.5"
                                    >
                                        <RefreshCw className="h-4 w-4" /> Refresh
                                    </button>
                                </div>

                                {activeQueue.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl text-muted">
                                        <Users className="h-12 w-12 mb-4 opacity-30" />
                                        <p className="text-lg font-medium">Queue is empty</p>
                                        <p className="text-sm mt-1">Issue a token to get started.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activeQueue.map((t, i) => {
                                            const doctor = typeof t.doctorId === "object" ? t.doctorId as Doctor : doctors.find((d) => d._id === t.doctorId);
                                            return (
                                                <div
                                                    key={t._id}
                                                    id={`queue-row-${t._id}`}
                                                    className={`card border flex items-center gap-4 py-4 transition-all hover:-translate-y-0.5 ${t.status === "serving" || t.status === "called"
                                                        ? "border-accent/30"
                                                        : ""
                                                        }`}
                                                    style={t.status === "serving" || t.status === "called"
                                                        ? { background: "hsl(160,84%,39%,0.06)" }
                                                        : {}}
                                                >
                                                    <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                                                        style={{ background: "hsl(217,33%,22%)" }}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-black text-lg text-primary-500">{t.tokenNumber}</span>
                                                            <span className="font-medium truncate">{t.patientName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className={`token-badge ${STATUS_STYLES[t.status] || "status-waiting"}`}>{t.status}</span>
                                                            <span className={`token-badge priority-${t.priority}`}>{t.priority}</span>
                                                            {doctor && <span className="text-xs text-muted">Dr. {doctor.name} · Rm {doctor.roomNumber}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        {t.estimatedWaitTime != null && (
                                                            <p className="text-sm font-bold text-warning flex items-center gap-1 justify-end">
                                                                <Clock className="h-3 w-3" /> ~{t.estimatedWaitTime} min
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── APPOINTMENTS TAB ──────────────────────────── */}
                        {tab === "appointments" && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">
                                        Appointments —{" "}
                                        <span className="text-muted font-normal text-base">
                                            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                                        </span>
                                    </h2>
                                    <button
                                        id="refresh-appt-btn"
                                        onClick={fetchAppointments}
                                        className="btn-ghost text-sm py-1.5"
                                    >
                                        <RefreshCw className="h-4 w-4" /> Refresh
                                    </button>
                                </div>

                                {!selectedDoctor && (
                                    <div className="flex items-center gap-2 p-4 rounded-xl mb-6 text-sm text-warning border border-warning/20"
                                        style={{ background: "hsl(38,92%,50%,0.08)" }}>
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        Select a doctor from the top bar to view their appointments.
                                    </div>
                                )}

                                {apptLoading ? (
                                    <div className="space-y-3">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className="skeleton h-20 w-full" />
                                        ))}
                                    </div>
                                ) : appointments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-xl text-muted">
                                        <CalendarDays className="h-12 w-12 mb-4 opacity-30" />
                                        <p className="text-lg font-medium">No appointments found</p>
                                        <p className="text-sm mt-1">Use the "Book Walk-In" tab to add one.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {appointments.map((appt) => (
                                            <div
                                                key={appt._id}
                                                id={`appt-row-${appt._id}`}
                                                className="card border flex items-center gap-4 py-4 transition-all hover:-translate-y-0.5"
                                            >
                                                <div className="text-center w-16 shrink-0">
                                                    <p className="text-xs text-muted">Time</p>
                                                    <p className="font-bold">{appt.appointmentTime || "--"}</p>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold truncate">{appt.patientName}</span>
                                                        <span className={`token-badge ${STATUS_STYLES[appt.status] || "status-waiting"}`}>{appt.status}</span>
                                                        <span className="token-badge priority-walk-in">{appt.source}</span>
                                                    </div>
                                                    {appt.patientPhone && (
                                                        <p className="text-xs text-muted mt-1 flex items-center gap-1">
                                                            <Phone className="h-3 w-3" /> {appt.patientPhone}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    {appt.status === "scheduled" && (
                                                        <>
                                                            <button
                                                                id={`checkin-btn-${appt._id}`}
                                                                onClick={() => issueFromAppointment(appt)}
                                                                disabled={actionLoading === `issue-${appt._id}`}
                                                                className="btn-accent text-xs py-1.5 px-3"
                                                            >
                                                                {actionLoading === `issue-${appt._id}`
                                                                    ? <RefreshCw className="h-3 w-3 animate-spin" />
                                                                    : <CheckCircle2 className="h-3 w-3" />
                                                                }
                                                                Check-In & Issue
                                                            </button>
                                                            <button
                                                                id={`cancel-btn-${appt._id}`}
                                                                onClick={() => cancelAppointment(appt._id)}
                                                                disabled={actionLoading === `cancel-${appt._id}`}
                                                                className="btn-danger text-xs py-1.5 px-3"
                                                            >
                                                                <XCircle className="h-3 w-3" /> Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    {appt.status === "checked-in" && (
                                                        <span className="text-xs text-accent font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="h-4 w-4" /> Token Issued
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── BOOK WALK-IN TAB ──────────────────────────── */}
                        {tab === "book" && (
                            <div className="max-w-md">
                                <h2 className="text-xl font-bold mb-6">Book Walk-In Appointment</h2>
                                <form onSubmit={bookWalkIn} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted mb-1">Patient Full Name *</label>
                                        <input
                                            id="walkin-name"
                                            type="text"
                                            value={walkInName}
                                            onChange={(e) => setWalkInName(e.target.value)}
                                            className="input-field"
                                            placeholder="e.g. Meera Nair"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted mb-1">Phone Number</label>
                                        <input
                                            id="walkin-phone"
                                            type="tel"
                                            value={walkInPhone}
                                            onChange={(e) => setWalkInPhone(e.target.value)}
                                            className="input-field"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted mb-1">Assign Doctor *</label>
                                        <select
                                            id="walkin-doctor"
                                            value={bookingDoctor}
                                            onChange={(e) => setBookingDoctor(e.target.value)}
                                            className="select-field"
                                            required
                                        >
                                            <option value="">— Select Doctor —</option>
                                            {doctors.map((d) => (
                                                <option key={d._id} value={d._id}>{d.name} — {d.specialisation}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted mb-1">Appointment Date</label>
                                        <input
                                            id="walkin-date"
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="input-field"
                                            style={{ colorScheme: "dark" }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted mb-1">Appointment Time</label>
                                        <input
                                            id="walkin-time"
                                            type="time"
                                            value={bookingTime}
                                            onChange={(e) => setBookingTime(e.target.value)}
                                            className="input-field"
                                            style={{ colorScheme: "dark" }}
                                        />
                                    </div>
                                    <button
                                        id="book-walkin-btn"
                                        type="submit"
                                        disabled={booking || !walkInName || !bookingDoctor}
                                        className="btn-primary w-full justify-center py-3"
                                    >
                                        {booking ? <><RefreshCw className="h-4 w-4 animate-spin" /> Booking…</> : <><UserPlus className="h-4 w-4" /> Book Appointment</>}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
