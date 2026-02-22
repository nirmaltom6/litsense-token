"use client";

import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/TenantContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    Activity, Users, Stethoscope, Plus, LogOut, Settings,
    Building2, ChevronLeft, Clock, CheckCircle2, AlertCircle,
    RefreshCw, X, Ticket
} from "lucide-react";

interface DoctorData {
    _id: string;
    name: string;
    specialisation: string;
    department?: string;
    roomNumber?: string;
    isActive: boolean;
}

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin?: string;
}

export default function HospitalAdminDashboard() {
    const { user, logout, loading: authLoading } = useAuth();
    const { hospitalId, hospitalName, brandColor } = useTenant();
    const router = useRouter();
    const [tab, setTab] = useState<"doctors" | "staff" | "config">("doctors");
    const [doctors, setDoctors] = useState<DoctorData[]>([]);
    const [staff, setStaff] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Forms
    const [doctorForm, setDoctorForm] = useState({
        name: "", specialisation: "", department: "", roomNumber: "",
    });
    const [staffForm, setStaffForm] = useState({
        name: "", email: "", password: "", role: "RECEPTIONIST",
    });

    // Auth guard
    useEffect(() => {
        if (!authLoading && (!user || !["HOSPITAL_ADMIN", "SUPER_ADMIN"].includes(user.role))) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const getAuthHeaders = () => {
        const jwt = localStorage.getItem("litsense_jwt");
        return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
    };

    const fetchDoctors = useCallback(async () => {
        if (!hospitalId) return;
        try {
            const res = await fetch(`/api/doctors?hospitalId=${hospitalId}`, { headers: getAuthHeaders() });
            if (res.ok) setDoctors(await res.json());
        } catch { }
    }, [hospitalId]);

    const fetchStaff = useCallback(async () => {
        if (!hospitalId) return;
        try {
            const res = await fetch(`/api/admin/users?hospitalId=${hospitalId}`, { headers: getAuthHeaders() });
            if (res.ok) setStaff(await res.json());
        } catch { }
    }, [hospitalId]);

    useEffect(() => {
        if (hospitalId) {
            Promise.all([fetchDoctors(), fetchStaff()]).then(() => setLoading(false));
        }
    }, [hospitalId, fetchDoctors, fetchStaff]);

    const createDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        try {
            const res = await fetch(`/api/doctors?hospitalId=${hospitalId}`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...doctorForm, hospitalId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuccess(`Dr. ${data.name} added successfully!`);
            setShowAddDoctor(false);
            setDoctorForm({ name: "", specialisation: "", department: "", roomNumber: "" });
            fetchDoctors();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const createStaffMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ ...staffForm, hospitalId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuccess(`${data.name} account created!`);
            setShowAddStaff(false);
            setStaffForm({ name: "", email: "", password: "", role: "RECEPTIONIST" });
            fetchStaff();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
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
                        <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-black">{hospitalName || "Hospital"}</span>
                </Link>
                <span className="text-muted text-sm mr-auto">/ Admin Panel</span>
                <span className="text-sm text-muted mr-4">{user.name}</span>
                <button onClick={logout} className="btn-ghost text-sm py-1.5 text-red-400 hover:text-red-300">
                    <LogOut className="h-4 w-4" /> Logout
                </button>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-0 border-b" style={{ background: "hsl(217,33%,14%)" }}>
                {[
                    { label: "Doctors", value: doctors.length, icon: <Stethoscope className="h-5 w-5" />, color: brandColor },
                    { label: "Staff Accounts", value: staff.length, icon: <Users className="h-5 w-5" />, color: "#F59E0B" },
                    { label: "Active", value: doctors.filter((d) => d.isActive).length, icon: <CheckCircle2 className="h-5 w-5" />, color: "#10B981" },
                ].map((s) => (
                    <div key={s.label} className="p-5 border-r last:border-r-0 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: s.color + "15", color: s.color }}>{s.icon}</div>
                        <div>
                            <p className="text-2xl font-black">{s.value}</p>
                            <p className="text-xs text-muted">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Feedback */}
            {error && (
                <div className="mx-6 mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-red-400 animate-slide-up">
                    <AlertCircle className="h-5 w-5 shrink-0" /><p className="text-sm flex-1">{error}</p>
                    <button onClick={() => setError("")}><X className="h-4 w-4" /></button>
                </div>
            )}
            {success && (
                <div className="mx-6 mt-4 p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center gap-3 text-green-400 animate-slide-up">
                    <CheckCircle2 className="h-5 w-5 shrink-0" /><p className="text-sm flex-1">{success}</p>
                    <button onClick={() => setSuccess("")}><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b px-6 pt-2 gap-1" style={{ background: "hsl(217,33%,14%)" }}>
                {[
                    { key: "doctors", label: "Doctors", icon: <Stethoscope className="h-4 w-4" /> },
                    { key: "staff", label: "Staff Accounts", icon: <Users className="h-4 w-4" /> },
                    { key: "config", label: "Configuration", icon: <Settings className="h-4 w-4" /> },
                ].map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-current" : "border-transparent text-muted hover:text-foreground"
                            }`}
                        style={tab === t.key ? { color: brandColor } : {}}>
                        {t.icon} {t.label}
                    </button>
                ))}
                <div className="flex-1" />
                {(tab === "doctors" || tab === "staff") && (
                    <button onClick={() => tab === "doctors" ? setShowAddDoctor(true) : setShowAddStaff(true)}
                        className="btn-primary text-sm py-1.5 mb-1">
                        <Plus className="h-4 w-4" /> {tab === "doctors" ? "Add Doctor" : "Add Staff"}
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center py-20"><RefreshCw className="h-8 w-8 animate-spin" style={{ color: brandColor }} /></div>
                ) : tab === "doctors" ? (
                    doctors.length === 0 ? (
                        <div className="card border border-dashed text-center py-20 text-muted">
                            <Stethoscope className="h-14 w-14 mx-auto mb-4 opacity-30" />
                            <p className="text-xl font-bold text-foreground mb-2">No Doctors Yet</p>
                            <p className="mb-6">Add your first doctor to start managing the queue.</p>
                            <button onClick={() => setShowAddDoctor(true)} className="btn-primary mx-auto"><Plus className="h-4 w-4" /> Add First Doctor</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {doctors.map((d) => (
                                <div key={d._id} className="card border transition-all hover:-translate-y-0.5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: brandColor }}>
                                            {d.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate">{d.name}</p>
                                            <p className="text-xs text-muted">{d.specialisation}</p>
                                        </div>
                                        <div className={`h-2.5 w-2.5 rounded-full ${d.isActive ? "bg-green-500" : "bg-red-500"}`} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted">
                                        <span>{d.department || "—"}</span>
                                        <span className="font-mono">Room {d.roomNumber || "—"}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : tab === "staff" ? (
                    staff.length === 0 ? (
                        <div className="card border border-dashed text-center py-20 text-muted">
                            <Users className="h-14 w-14 mx-auto mb-4 opacity-30" />
                            <p className="text-xl font-bold text-foreground mb-2">No Staff Accounts</p>
                            <button onClick={() => setShowAddStaff(true)} className="btn-primary mx-auto mt-4"><Plus className="h-4 w-4" /> Create First Account</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {staff.map((u) => {
                                const roleColors: Record<string, string> = { HOSPITAL_ADMIN: brandColor, DOCTOR: "#10B981", RECEPTIONIST: "#F59E0B" };
                                return (
                                    <div key={u._id} className="card border flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                            style={{ background: roleColors[u.role] || "#64748B" }}>
                                            {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold">{u.name}</p>
                                            <p className="text-xs text-muted">{u.email}</p>
                                        </div>
                                        <span className="px-2 py-1 rounded text-xs font-bold" style={{
                                            background: (roleColors[u.role] || "#64748B") + "20",
                                            color: roleColors[u.role] || "#64748B",
                                        }}>{u.role.replace("_", " ")}</span>
                                        {u.lastLogin && <span className="text-xs text-muted"><Clock className="h-3 w-3 inline" /> {new Date(u.lastLogin).toLocaleDateString()}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <div className="max-w-lg space-y-6">
                        <h3 className="text-xl font-bold">Hospital Configuration</h3>
                        <div className="card border space-y-4">
                            <div>
                                <label className="text-sm text-muted">Working Hours</label>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <input type="time" className="input-field" defaultValue="09:00" />
                                    <input type="time" className="input-field" defaultValue="17:00" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-muted">Token Slot Duration (minutes)</label>
                                <input type="number" className="input-field w-full mt-1" defaultValue={15} min={5} max={60} />
                            </div>
                            <div>
                                <label className="text-sm text-muted">Max Walk-ins Per Doctor</label>
                                <input type="number" className="input-field w-full mt-1" defaultValue={5} min={1} max={20} />
                            </div>
                            <button className="btn-primary w-full justify-center mt-2"><CheckCircle2 className="h-4 w-4" /> Save Configuration</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Doctor Modal */}
            {showAddDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddDoctor(false)}>
                    <form onSubmit={createDoctor} onClick={(e) => e.stopPropagation()} className="card border w-full max-w-lg mx-4 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Add Doctor</h3>
                            <button type="button" onClick={() => setShowAddDoctor(false)}><X className="h-5 w-5 text-muted" /></button>
                        </div>
                        <div className="space-y-4">
                            <input className="input-field w-full" placeholder="Full Name *" required value={doctorForm.name}
                                onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} />
                            <input className="input-field w-full" placeholder="Specialisation *" required value={doctorForm.specialisation}
                                onChange={(e) => setDoctorForm({ ...doctorForm, specialisation: e.target.value })} />
                            <div className="grid grid-cols-2 gap-3">
                                <input className="input-field w-full" placeholder="Department" value={doctorForm.department}
                                    onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })} />
                                <input className="input-field w-full" placeholder="Room Number" value={doctorForm.roomNumber}
                                    onChange={(e) => setDoctorForm({ ...doctorForm, roomNumber: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 pt-4 border-t">
                            <button type="button" onClick={() => setShowAddDoctor(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                            <button type="submit" className="btn-primary flex-1 justify-center"><Plus className="h-4 w-4" /> Add Doctor</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Add Staff Modal */}
            {showAddStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddStaff(false)}>
                    <form onSubmit={createStaffMember} onClick={(e) => e.stopPropagation()} className="card border w-full max-w-lg mx-4 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Create Staff Account</h3>
                            <button type="button" onClick={() => setShowAddStaff(false)}><X className="h-5 w-5 text-muted" /></button>
                        </div>
                        <div className="space-y-4">
                            <input className="input-field w-full" placeholder="Full Name *" required value={staffForm.name}
                                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} />
                            <input type="email" className="input-field w-full" placeholder="Email *" required value={staffForm.email}
                                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} />
                            <input type="password" className="input-field w-full" placeholder="Password *" required value={staffForm.password}
                                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} />
                            <select className="select-field w-full" value={staffForm.role}
                                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                                <option value="DOCTOR">Doctor</option>
                                <option value="RECEPTIONIST">Receptionist</option>
                            </select>
                        </div>
                        <div className="flex gap-3 mt-6 pt-4 border-t">
                            <button type="button" onClick={() => setShowAddStaff(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                            <button type="submit" className="btn-primary flex-1 justify-center"><Plus className="h-4 w-4" /> Create Account</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
