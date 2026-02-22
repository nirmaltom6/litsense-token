"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
    Activity, Building2, Users, Plus, Shield, LogOut,
    Stethoscope, Ticket, ChevronRight, Settings, Eye, EyeOff,
    AlertCircle, CheckCircle2, RefreshCw, X
} from "lucide-react";

interface HospitalData {
    _id: string;
    name: string;
    slug: string;
    brandColor: string;
    isActive: boolean;
    subscription: string;
    stats: { doctors: number; users: number; tokensToday: number };
}

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    hospitalId: any;
    lastLogin?: string;
}

export default function SuperAdminDashboard() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();
    const [hospitals, setHospitals] = useState<HospitalData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [tab, setTab] = useState<"hospitals" | "users">("hospitals");
    const [loading, setLoading] = useState(true);
    const [showCreateHospital, setShowCreateHospital] = useState(false);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form states
    const [hospitalForm, setHospitalForm] = useState({
        name: "", slug: "", brandColor: "#0891B2", address: "", email: "",
        adminEmail: "", adminPassword: "", adminName: "", subscription: "free",
    });
    const [userForm, setUserForm] = useState({
        name: "", email: "", password: "", role: "HOSPITAL_ADMIN", hospitalId: "",
    });

    // Auth guard
    useEffect(() => {
        if (!authLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const getAuthHeaders = () => {
        const jwt = localStorage.getItem("litsense_jwt");
        return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
    };

    const fetchHospitals = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/hospitals", { headers: getAuthHeaders() });
            if (res.ok) setHospitals(await res.json());
        } catch { }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/users", { headers: getAuthHeaders() });
            if (res.ok) setUsers(await res.json());
        } catch { }
    }, []);

    useEffect(() => {
        if (user?.role === "SUPER_ADMIN") {
            Promise.all([fetchHospitals(), fetchUsers()]).then(() => setLoading(false));
        }
    }, [user, fetchHospitals, fetchUsers]);

    const createHospital = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        try {
            const res = await fetch("/api/admin/hospitals", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(hospitalForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuccess(`Hospital "${data.name}" created successfully!`);
            setShowCreateHospital(false);
            setHospitalForm({ name: "", slug: "", brandColor: "#0891B2", address: "", email: "", adminEmail: "", adminPassword: "", adminName: "", subscription: "free" });
            fetchHospitals();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(userForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSuccess(`User "${data.name}" created successfully!`);
            setShowCreateUser(false);
            setUserForm({ name: "", email: "", password: "", role: "HOSPITAL_ADMIN", hospitalId: "" });
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Activity className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    const totalDoctors = hospitals.reduce((s, h) => s + h.stats.doctors, 0);
    const totalUsers = users.length;
    const totalTokens = hospitals.reduce((s, h) => s + h.stats.tokensToday, 0);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="h-14 flex items-center px-6 border-b sticky top-0 z-30" style={{ background: "hsl(222,47%,9%,0.9)", backdropFilter: "blur(12px)" }}>
                <div className="flex items-center gap-3 mr-auto">
                    <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="font-black text-lg">Super Admin</span>
                        <span className="text-xs text-muted ml-2">({user.name})</span>
                    </div>
                </div>
                <button onClick={logout} className="btn-ghost text-sm py-1.5 text-red-400 hover:text-red-300">
                    <LogOut className="h-4 w-4" /> Logout
                </button>
            </header>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-0 border-b" style={{ background: "hsl(217,33%,14%)" }}>
                {[
                    { label: "Hospitals", value: hospitals.length, icon: <Building2 className="h-5 w-5" />, color: "#0891B2" },
                    { label: "Doctors", value: totalDoctors, icon: <Stethoscope className="h-5 w-5" />, color: "#10B981" },
                    { label: "Users", value: totalUsers, icon: <Users className="h-5 w-5" />, color: "#F59E0B" },
                    { label: "Tokens Today", value: totalTokens, icon: <Ticket className="h-5 w-5" />, color: "#8B5CF6" },
                ].map((s) => (
                    <div key={s.label} className="p-5 border-r last:border-r-0 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: s.color + "15", color: s.color }}>
                            {s.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-black">{s.value}</p>
                            <p className="text-xs text-muted">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Feedback Messages */}
            {error && (
                <div className="mx-6 mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-red-400 animate-slide-up">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm flex-1">{error}</p>
                    <button onClick={() => setError("")}><X className="h-4 w-4" /></button>
                </div>
            )}
            {success && (
                <div className="mx-6 mt-4 p-4 rounded-xl border border-green-500/30 bg-green-500/10 flex items-center gap-3 text-green-400 animate-slide-up">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <p className="text-sm flex-1">{success}</p>
                    <button onClick={() => setSuccess("")}><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Tabs + Content */}
            <div className="flex-1 flex flex-col">
                <div className="flex border-b px-6 pt-2 gap-1" style={{ background: "hsl(217,33%,14%)" }}>
                    {[
                        { key: "hospitals", label: "Hospitals", icon: <Building2 className="h-4 w-4" /> },
                        { key: "users", label: "All Users", icon: <Users className="h-4 w-4" /> },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-red-500 text-red-400" : "border-transparent text-muted hover:text-foreground"
                                }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button
                        onClick={() => tab === "hospitals" ? setShowCreateHospital(true) : setShowCreateUser(true)}
                        className="btn-primary text-sm py-1.5 mb-1"
                    >
                        <Plus className="h-4 w-4" /> {tab === "hospitals" ? "Register Hospital" : "Create User"}
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
                        </div>
                    ) : tab === "hospitals" ? (
                        <div className="space-y-4">
                            {hospitals.length === 0 ? (
                                <div className="card border border-dashed text-center py-20 text-muted">
                                    <Building2 className="h-14 w-14 mx-auto mb-4 opacity-30" />
                                    <p className="text-xl font-bold text-foreground mb-2">No Hospitals Registered</p>
                                    <p className="mb-6">Click "Register Hospital" to onboard the first tenant.</p>
                                    <button onClick={() => setShowCreateHospital(true)} className="btn-primary mx-auto">
                                        <Plus className="h-4 w-4" /> Add First Hospital
                                    </button>
                                </div>
                            ) : (
                                hospitals.map((h) => (
                                    <div key={h._id} className="card border flex items-center gap-4 transition-all hover:-translate-y-0.5">
                                        <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0" style={{ background: h.brandColor }}>
                                            {h.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold truncate">{h.name}</h3>
                                                <span className="px-2 py-0.5 rounded text-xs font-bold uppercase" style={{
                                                    background: h.subscription === "enterprise" ? "#8B5CF620" : h.subscription === "pro" ? "#0891B220" : "#64748B20",
                                                    color: h.subscription === "enterprise" ? "#8B5CF6" : h.subscription === "pro" ? "#0891B2" : "#64748B",
                                                }}>{h.subscription}</span>
                                            </div>
                                            <p className="text-sm text-muted">
                                                <code className="text-xs px-1 py-0.5 rounded" style={{ background: "hsl(217,33%,22%)" }}>{h.slug}</code>
                                                <span className="ml-3">{h.stats.doctors} doctors · {h.stats.users} users · {h.stats.tokensToday} tokens today</span>
                                            </p>
                                        </div>
                                        <div className={`h-2.5 w-2.5 rounded-full ${h.isActive ? "bg-green-500" : "bg-red-500"}`} />
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.length === 0 ? (
                                <div className="card border border-dashed text-center py-20 text-muted">
                                    <Users className="h-14 w-14 mx-auto mb-4 opacity-30" />
                                    <p className="text-xl font-bold text-foreground mb-2">No Users</p>
                                    <button onClick={() => setShowCreateUser(true)} className="btn-primary mx-auto mt-4">
                                        <Plus className="h-4 w-4" /> Create First User
                                    </button>
                                </div>
                            ) : (
                                users.map((u) => {
                                    const roleColors: Record<string, string> = {
                                        SUPER_ADMIN: "#E11D48", HOSPITAL_ADMIN: "#0891B2", DOCTOR: "#10B981", RECEPTIONIST: "#F59E0B",
                                    };
                                    return (
                                        <div key={u._id} className="card border flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                                style={{ background: roleColors[u.role] || "#64748B" }}>
                                                {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{u.name}</p>
                                                <p className="text-xs text-muted">{u.email}</p>
                                            </div>
                                            <span className="px-2 py-1 rounded text-xs font-bold" style={{
                                                background: (roleColors[u.role] || "#64748B") + "20",
                                                color: roleColors[u.role] || "#64748B",
                                            }}>{u.role.replace("_", " ")}</span>
                                            {u.hospitalId && typeof u.hospitalId === "object" && (
                                                <span className="text-xs text-muted">{u.hospitalId.name}</span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Hospital Modal */}
            {showCreateHospital && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreateHospital(false)}>
                    <form onSubmit={createHospital} onClick={(e) => e.stopPropagation()} className="card border w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Register New Hospital</h3>
                            <button type="button" onClick={() => setShowCreateHospital(false)}><X className="h-5 w-5 text-muted" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted mb-1">Hospital Name *</label>
                                <input className="input-field w-full" required value={hospitalForm.name}
                                    onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-muted mb-1">URL Slug *</label>
                                    <input className="input-field w-full" required value={hospitalForm.slug}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, slug: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-1">Brand Color</label>
                                    <input type="color" className="h-10 w-full rounded-lg border cursor-pointer" value={hospitalForm.brandColor}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, brandColor: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-muted mb-1">Address</label>
                                <input className="input-field w-full" value={hospitalForm.address}
                                    onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm text-muted mb-1">Subscription</label>
                                <select className="select-field w-full" value={hospitalForm.subscription}
                                    onChange={(e) => setHospitalForm({ ...hospitalForm, subscription: e.target.value })}>
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className="border-t pt-4 mt-4">
                                <p className="text-sm font-bold text-muted mb-3">Hospital Admin Account (Optional)</p>
                                <div className="space-y-3">
                                    <input className="input-field w-full" placeholder="Admin Name" value={hospitalForm.adminName}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, adminName: e.target.value })} />
                                    <input type="email" className="input-field w-full" placeholder="Admin Email" value={hospitalForm.adminEmail}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, adminEmail: e.target.value })} />
                                    <input type="password" className="input-field w-full" placeholder="Admin Password" value={hospitalForm.adminPassword}
                                        onChange={(e) => setHospitalForm({ ...hospitalForm, adminPassword: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 pt-4 border-t">
                            <button type="button" onClick={() => setShowCreateHospital(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                            <button type="submit" className="btn-primary flex-1 justify-center"><Plus className="h-4 w-4" /> Register</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreateUser(false)}>
                    <form onSubmit={createUser} onClick={(e) => e.stopPropagation()} className="card border w-full max-w-lg mx-4 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Create User Account</h3>
                            <button type="button" onClick={() => setShowCreateUser(false)}><X className="h-5 w-5 text-muted" /></button>
                        </div>
                        <div className="space-y-4">
                            <input className="input-field w-full" placeholder="Full Name *" required value={userForm.name}
                                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                            <input type="email" className="input-field w-full" placeholder="Email *" required value={userForm.email}
                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                            <input type="password" className="input-field w-full" placeholder="Password *" required value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                            <select className="select-field w-full" value={userForm.role}
                                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                                <option value="SUPER_ADMIN">Super Admin</option>
                                <option value="HOSPITAL_ADMIN">Hospital Admin</option>
                                <option value="DOCTOR">Doctor</option>
                                <option value="RECEPTIONIST">Receptionist</option>
                            </select>
                            <select className="select-field w-full" value={userForm.hospitalId}
                                onChange={(e) => setUserForm({ ...userForm, hospitalId: e.target.value })}>
                                <option value="">— Select Hospital —</option>
                                {hospitals.map((h) => (
                                    <option key={h._id} value={h._id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 mt-6 pt-4 border-t">
                            <button type="button" onClick={() => setShowCreateUser(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                            <button type="submit" className="btn-primary flex-1 justify-center"><Plus className="h-4 w-4" /> Create</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
