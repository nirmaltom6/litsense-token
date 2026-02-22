"use client";

import { useTenant } from "@/lib/TenantContext";
import { useDoctors } from "@/hooks/useDoctors";
import { useTokenQueue } from "@/hooks/useTokenQueue";
import { fetchApi } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { Token, Appointment, Doctor } from "@/lib/types";
import Link from "next/link";
import {
    Activity, RefreshCw, Ticket, Clock, Users, CalendarCheck,
    CheckCircle2, XCircle, ChevronLeft, Search
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
    scheduled: "status-waiting",
    "checked-in": "status-serving",
    cancelled: "status-no-show",
    "no-show": "status-no-show",
    completed: "status-complete",
};

export default function TenantReception() {
    const { hospitalId, hospitalName, brandColor, loading: tenantLoading } = useTenant();
    const { doctors } = useDoctors(hospitalId);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
    const { queue: activeQueue, refresh: refreshQueue } = useTokenQueue(
        selectedDoctor || undefined, 5000, hospitalId
    );

    const [tab, setTab] = useState<"queue" | "appointments" | "book">("queue");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patientName, setPatientName] = useState("");
    const [priority, setPriority] = useState("walk-in");
    const [issuing, setIssuing] = useState(false);
    const [issuedToken, setIssuedToken] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Book walk-in form
    const [bookName, setBookName] = useState("");
    const [bookPhone, setBookPhone] = useState("");
    const [bookTime, setBookTime] = useState("09:00");

    const fetchAppointments = useCallback(async () => {
        if (!hospitalId) return;
        try {
            const params = new URLSearchParams({ hospitalId });
            if (selectedDoctor) params.set("doctorId", selectedDoctor);
            if (selectedDate) params.set("date", selectedDate);
            const data = await fetchApi<Appointment[]>(`/appointments?${params}`);
            setAppointments(data);
        } catch { }
    }, [hospitalId, selectedDoctor, selectedDate]);

    useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

    const issueToken = async () => {
        if (!selectedDoctor || !patientName.trim() || !hospitalId) return;
        setIssuing(true);
        try {
            const res = await fetchApi<{ token: Token }>("/tokens/issue", {
                method: "POST",
                body: JSON.stringify({
                    hospitalId,
                    doctorId: selectedDoctor,
                    patientName: patientName.trim(),
                    priority,
                }),
            });
            setIssuedToken(res.token || res);
            setPatientName("");
            refreshQueue();
        } catch (err: any) {
            alert("Failed: " + err.message);
        } finally {
            setIssuing(false);
        }
    };

    const checkInAppointment = async (appointmentId: string) => {
        setActionLoading(appointmentId);
        try {
            await fetchApi("/tokens/issue", {
                method: "POST",
                body: JSON.stringify({ hospitalId, appointmentId }),
            });
            fetchAppointments();
            refreshQueue();
        } catch (err: any) {
            alert("Check-in failed: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const cancelAppointment = async (appointmentId: string) => {
        setActionLoading(`cancel-${appointmentId}`);
        try {
            await fetchApi(`/appointments/${appointmentId}/cancel`, { method: "PUT" });
            fetchAppointments();
        } catch (err: any) {
            alert("Cancel failed: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const bookWalkIn = async () => {
        if (!selectedDoctor || !bookName.trim() || !hospitalId) return;
        setActionLoading("booking");
        try {
            await fetchApi("/appointments", {
                method: "POST",
                body: JSON.stringify({
                    hospitalId,
                    patientName: bookName.trim(),
                    patientPhone: bookPhone,
                    doctorId: selectedDoctor,
                    appointmentDate: selectedDate,
                    appointmentTime: bookTime,
                    source: "walk-in",
                    type: "walkin",
                }),
            });
            setBookName(""); setBookPhone(""); setBookTime("09:00");
            fetchAppointments();
        } catch (err: any) {
            alert("Booking failed: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (tenantLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(222,47%,9%)" }}>
                <Activity className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Top Navbar */}
            <header
                className="h-14 flex items-center px-6 border-b sticky top-0 z-30"
                style={{ background: "hsl(222,47%,9%,0.9)", backdropFilter: "blur(12px)" }}
            >
                <Link href="/login" className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mr-4">
                    <ChevronLeft className="h-4 w-4" />
                    <div className="flex items-center gap-1.5">
                        <div className="h-6 w-6 rounded flex items-center justify-center" style={{ background: brandColor }}>
                            <Activity className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-black">{hospitalName}</span>
                    </div>
                </Link>

                <span className="text-muted text-sm mr-auto">/ Reception</span>

                <select
                    id="doctor-selector"
                    className="select-field w-auto min-w-[200px] mr-3"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                >
                    <option value="">All Doctors</option>
                    {doctors.map((d) => (
                        <option key={d._id} value={d._id}>{d.name} — Rm {d.roomNumber}</option>
                    ))}
                </select>

                <input
                    type="date"
                    className="input-field w-auto"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </header>

            <div className="flex h-[calc(100vh-3.5rem)]">
                {/* Left Sidebar: Issue Token */}
                <aside className="w-80 border-r flex flex-col" style={{ background: "hsl(217,33%,14%)" }}>
                    <div className="p-5 border-b">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Issue Walk-In Token</h3>
                        <div className="space-y-3">
                            <input
                                id="patient-name-input"
                                type="text"
                                placeholder="Patient full name"
                                className="input-field w-full"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                            />
                            <select
                                className="select-field w-full"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <option value="walk-in">Walk-In (Normal)</option>
                                <option value="emergency">Emergency</option>
                            </select>
                            <button
                                id="issue-token-btn"
                                onClick={issueToken}
                                disabled={issuing || !selectedDoctor || !patientName.trim()}
                                className="btn-accent w-full justify-center py-2.5 disabled:opacity-50"
                            >
                                {issuing
                                    ? <RefreshCw className="h-4 w-4 animate-spin" />
                                    : <Ticket className="h-4 w-4" />}
                                Issue Token
                            </button>
                        </div>
                    </div>

                    {/* Issued Token Receipt */}
                    {issuedToken && (
                        <div id="token-receipt" className="p-5 border-b animate-slide-up">
                            <div className="card border text-center" style={{ borderColor: brandColor + "40" }}>
                                <p className="text-xs text-muted uppercase tracking-widest mb-1">Token Issued</p>
                                <p className="text-4xl font-black" style={{ color: brandColor }}>{issuedToken.tokenNumber}</p>
                                <p className="text-sm mt-1 font-medium">{issuedToken.patientName}</p>
                                <p className="text-xs text-muted mt-2">
                                    Wait: ~{issuedToken.estimatedWaitTime ?? issuedToken.estimatedWaitMin ?? 0} min
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex-1" />
                    <div className="p-4 border-t text-center text-xs text-muted">
                        Auto-refreshing every 5s • {activeQueue.length} in queue
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b px-6 pt-2 gap-1" style={{ background: "hsl(217,33%,14%)" }}>
                        {[
                            { key: "queue", label: "Live Queue", icon: <Users className="h-4 w-4" /> },
                            { key: "appointments", label: "Appointments", icon: <CalendarCheck className="h-4 w-4" /> },
                            { key: "book", label: "Book Walk-In", icon: <Ticket className="h-4 w-4" /> },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                                        ? "border-current text-foreground"
                                        : "border-transparent text-muted hover:text-foreground"
                                    }`}
                                style={tab === t.key ? { color: brandColor } : {}}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 p-6">
                        {tab === "queue" && (
                            <div className="space-y-3">
                                {activeQueue.length === 0 ? (
                                    <div className="card border border-dashed text-center py-16 text-muted">
                                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">Queue is empty</p>
                                        <p className="text-sm mt-1">Issue a token to start.</p>
                                    </div>
                                ) : (
                                    activeQueue.map((t, i) => {
                                        const doc = typeof t.doctorId === "object" ? t.doctorId as Doctor : null;
                                        return (
                                            <div key={t._id} className="card border flex items-center gap-4 transition-all hover:-translate-y-0.5">
                                                <span className="text-sm text-muted w-6 text-right">{i + 1}</span>
                                                <span className="font-black text-lg" style={{ color: brandColor }}>{t.tokenNumber}</span>
                                                <span className="font-medium flex-1">{t.patientName}</span>
                                                {doc && <span className="text-xs text-muted">Dr. {doc.name}</span>}
                                                <span className={`token-badge ${t.status === "serving" ? "status-serving" : t.status === "called" ? "status-serving" : "status-waiting"}`}>
                                                    {t.status}
                                                </span>
                                                {t.estimatedWaitTime != null && (
                                                    <span className="text-xs text-warning flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> ~{t.estimatedWaitTime}m
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {tab === "appointments" && (
                            <div className="space-y-3">
                                {appointments.length === 0 ? (
                                    <div className="card border border-dashed text-center py-16 text-muted">
                                        <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No appointments today</p>
                                    </div>
                                ) : (
                                    appointments.map((a) => (
                                        <div key={a._id} className="card border flex items-center gap-4">
                                            <div className="flex-1">
                                                <p className="font-semibold">{a.patientName}</p>
                                                <p className="text-xs text-muted">{a.appointmentTime} · {typeof a.doctorId === "object" ? (a.doctorId as Doctor).name : ""}</p>
                                            </div>
                                            <span className={`token-badge ${STATUS_STYLES[a.status] || "status-waiting"}`}>{a.status}</span>
                                            {a.status === "scheduled" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => checkInAppointment(a._id)}
                                                        disabled={!!actionLoading}
                                                        className="btn-accent text-xs py-1 px-3"
                                                    >
                                                        {actionLoading === a._id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                                        Check In
                                                    </button>
                                                    <button
                                                        onClick={() => cancelAppointment(a._id)}
                                                        disabled={!!actionLoading}
                                                        className="btn-danger text-xs py-1 px-3"
                                                    >
                                                        <XCircle className="h-3 w-3" /> Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {tab === "book" && (
                            <div className="max-w-lg space-y-4">
                                <h3 className="text-lg font-bold mb-4">Book Walk-In Appointment</h3>
                                <input
                                    type="text" placeholder="Patient Name"
                                    className="input-field w-full" value={bookName}
                                    onChange={(e) => setBookName(e.target.value)}
                                />
                                <input
                                    type="tel" placeholder="Phone (optional)"
                                    className="input-field w-full" value={bookPhone}
                                    onChange={(e) => setBookPhone(e.target.value)}
                                />
                                <input
                                    type="time" className="input-field w-full"
                                    value={bookTime} onChange={(e) => setBookTime(e.target.value)}
                                />
                                <button
                                    onClick={bookWalkIn}
                                    disabled={!!actionLoading || !bookName.trim() || !selectedDoctor}
                                    className="btn-primary w-full justify-center py-2.5"
                                >
                                    {actionLoading === "booking" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                                    Book Appointment
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
