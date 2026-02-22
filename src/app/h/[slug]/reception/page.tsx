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
    CheckCircle2, XCircle, ChevronLeft, Search, LogOut
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";

const STATUS_STYLES: Record<string, string> = {
    scheduled: "status-waiting",
    "checked-in": "status-serving",
    cancelled: "status-no-show",
    "no-show": "status-no-show",
    completed: "status-complete",
};

export default function TenantReception() {
    const { logout } = useAuth();
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
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
        setError(null);
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
            setError(err.message);
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
        <div className="min-h-screen bg-background text-foreground">
            {/* Top Navbar */}
            <header
                className="h-14 flex items-center px-4 md:px-6 border-b sticky top-0 z-30"
                style={{ background: "hsl(222,47%,12%,0.95)", backdropFilter: "blur(16px)" }}
            >
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
                <span className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] hidden lg:inline shrink-0">Terminal / Reception</span>

                <div className="flex-1 max-w-sm mx-4 relative hidden md:block group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-teal transition-colors" />
                    <input
                        type="text"
                        placeholder="Search patients..."
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

                <div className="flex items-center gap-2 ml-auto">
                    <select
                        id="doctor-selector"
                        className="select-field w-auto min-w-[140px] md:min-w-[200px] text-xs py-1.5"
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                    >
                        <option value="">All Doctors</option>
                        {doctors.map((d) => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        className="input-field w-auto text-xs py-1.5 hidden sm:block"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />

                    <button
                        onClick={logout}
                        className="p-2 text-muted hover:text-red-400 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </header>

            <div className="flex h-[calc(100vh-3.5rem)] relative overflow-hidden">
                {/* Left Sidebar: Issue Token */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-80 bg-[#1e2c3e] border-r flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                    style={{ background: "rgba(20, 33, 49, 0.65)", backdropFilter: "blur(20px)" }}
                >
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

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs animate-shake">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden absolute top-4 -right-12 p-2 bg-black/50 rounded-full text-white"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    )}

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
                    <div className="flex border-b px-2 md:px-6 pt-2 gap-1 overflow-x-auto no-scrollbar whitespace-nowrap" style={{ background: "hsl(217,33%,14%)" }}>
                        {[
                            { key: "queue", label: "Live Queue", icon: <Users className="h-4 w-4" /> },
                            { key: "appointments", label: "Appointments", icon: <CalendarCheck className="h-4 w-4" /> },
                            { key: "book", label: "Book Walk-In", icon: <Ticket className="h-4 w-4" /> },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key as any)}
                                className={`flex items-center shrink-0 gap-2 px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium border-b-2 transition-colors ${tab === t.key
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
                    <div className="flex-1 p-4 md:p-6">
                        <div className="mb-6 md:hidden">
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-teal transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search patients..."
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

                        {tab === "queue" && (
                            <div className="space-y-3">
                                {activeQueue.filter(t => t.patientName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                    <div className="empty-state-card">
                                        <Users className="empty-state-icon" />
                                        <h3 className="empty-state-title">{searchQuery ? "No matches found" : "Queue is empty"}</h3>
                                        <p className="empty-state-desc">
                                            {searchQuery ? `We couldn't find anyone matching "${searchQuery}".` : "No patients are currently waiting. Use the sidebar to issue a new walk-in token."}
                                        </p>
                                    </div>
                                ) : (
                                    activeQueue
                                        .filter(t => t.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((t, i) => {
                                            const doc = typeof t.doctorId === "object" ? t.doctorId as Doctor : null;
                                            return (
                                                <div key={t._id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 transition-all hover:-translate-y-0.5 ${t.status === "serving" ? "animate-pulse-glow" : "bg-card"}`}
                                                    style={t.status === "serving" ? { borderColor: brandColor + "80", background: brandColor + "05" } : {}}>
                                                    <div className="flex items-center gap-3 sm:gap-4">
                                                        <span className="text-xs md:text-sm text-muted w-4 md:w-6 text-right shrink-0">{i + 1}</span>
                                                        <span className="font-black text-xl md:text-2xl shrink-0 leading-none" style={{ color: brandColor }}>{t.tokenNumber}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="font-bold truncate text-base md:text-lg block">{t.patientName}</span>
                                                            {doc && <span className="text-[10px] md:text-xs text-muted block">Dr. {doc.name}</span>}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-3 ml-0 sm:ml-auto mt-2 sm:mt-0 p-2 sm:p-0 rounded-lg sm:rounded-none bg-black/10 sm:bg-transparent">
                                                        <span className={`token-badge text-[10px] md:text-xs ${t.status === "serving" ? "status-serving" :
                                                            t.status === "called" ? "status-called" :
                                                                t.status === "completed" ? "status-complete" :
                                                                    t.status === "no-show" ? "status-no-show" :
                                                                        "status-waiting"
                                                            }`}>
                                                            {t.status}
                                                        </span>
                                                        {t.estimatedWaitTime != null && (
                                                            <span className="text-xs text-warning flex items-center gap-1 font-bold">
                                                                <Clock className="h-3 w-3" /> ~{t.estimatedWaitTime}m
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        )}

                        {tab === "appointments" && (
                            <div className="space-y-3">
                                {appointments.filter(a => a.patientName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                    <div className="empty-state-card">
                                        <CalendarCheck className="empty-state-icon" />
                                        <h3 className="empty-state-title">{searchQuery ? "No matches found" : "No Appointments"}</h3>
                                        <p className="empty-state-desc">
                                            {searchQuery ? `We couldn't find any appointments matching "${searchQuery}".` : "There are no appointments scheduled for the selected doctor on this date."}
                                        </p>
                                    </div>
                                ) : (
                                    appointments
                                        .filter(a => a.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((a) => (
                                            <div key={a._id} className="p-4 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:border-primary-500/50">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-bold text-base md:text-lg truncate">{a.patientName}</p>
                                                        <span className={`token-badge text-[10px] ${STATUS_STYLES[a.status] || "status-waiting"}`}>{a.status}</span>
                                                    </div>
                                                    <p className="text-xs text-muted flex items-center gap-1.5 font-medium">
                                                        <Clock className="h-3 w-3" /> {a.appointmentTime} · {typeof a.doctorId === "object" ? (a.doctorId as Doctor).name : ""}
                                                    </p>
                                                </div>

                                                {a.status === "scheduled" && (
                                                    <div className="flex gap-2 mt-2 sm:mt-0">
                                                        <button
                                                            onClick={() => checkInAppointment(a._id)}
                                                            disabled={!!actionLoading}
                                                            className="btn-accent flex-1 sm:flex-none text-xs py-2 px-4 shadow-lg shadow-primary-500/10"
                                                        >
                                                            {actionLoading === a._id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                                            Check In
                                                        </button>
                                                        <button
                                                            onClick={() => cancelAppointment(a._id)}
                                                            disabled={!!actionLoading}
                                                            className="btn-danger flex-1 sm:flex-none text-xs py-2 px-4"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" /> Cancel
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
