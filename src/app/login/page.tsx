"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import {
    Activity, Lock, Mail, Eye, EyeOff, AlertCircle,
    ArrowRight, Shield, Building2, LogIn
} from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { user, login, loading: authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Auto-redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            const redirects: Record<string, string> = {
                SUPER_ADMIN: "/super-admin",
                HOSPITAL_ADMIN: `/h/${user.hospitalSlug}/admin`,
                DOCTOR: `/h/${user.hospitalSlug}/doctor`,
                RECEPTIONIST: `/h/${user.hospitalSlug}/reception`,
            };
            router.push(redirects[user.role] || "/");
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        const result = await login(email, password);

        if (result.success && result.redirect) {
            router.push(result.redirect);
        } else {
            setError(result.error || "Login failed");
            setSubmitting(false);
        }
    };

    const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
        setEmail(demoEmail);
        setPassword(demoPass);
        setError("");
        setSubmitting(true);

        const result = await login(demoEmail, demoPass);
        if (result.success && result.redirect) {
            router.push(result.redirect);
        } else {
            setError(result.error || "Login failed");
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Left Panel — Branding */}
            <div
                className="hidden lg:flex flex-col justify-between w-[480px] p-10"
                style={{
                    background: "linear-gradient(135deg, hsl(199,89%,25%) 0%, hsl(222,47%,11%) 100%)",
                }}
            >
                <div>
                    <Link href="/" className="flex items-center gap-3 mb-16">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight">LITSENSE</span>
                    </Link>

                    <h1 className="text-4xl font-black text-white leading-tight mb-4">
                        Multi-Tenant<br />Healthcare Platform
                    </h1>
                    <p className="text-white/60 text-lg leading-relaxed">
                        Role-based access control with complete tenant isolation.
                        Each hospital operates independently with its own data, staff, and configuration.
                    </p>
                </div>

                <div className="space-y-4">
                    {[
                        { icon: <Shield className="h-5 w-5" />, text: "JWT-based authentication with httpOnly cookies" },
                        { icon: <Building2 className="h-5 w-5" />, text: "hospitalId scoped to every query" },
                        { icon: <Lock className="h-5 w-5" />, text: "RBAC: Super Admin → Hospital Admin → Doctor → Receptionist" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 text-white/40 text-sm">
                            <div className="text-primary-400">{item.icon}</div>
                            {item.text}
                        </div>
                    ))}
                </div>

                <p className="text-white/20 text-xs">
                    © 2026 Litsense Private Limited · Multi-Tenant SaaS
                </p>
            </div>

            {/* Right Panel — Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8 lg:hidden">
                        <div className="inline-flex items-center gap-2 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-black">LITSENSE</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black mb-2">Welcome back</h2>
                    <p className="text-muted mb-8">Sign in to your account to continue</p>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-red-400 animate-slide-up">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field w-full pl-11"
                                    placeholder="you@hospital.com"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field w-full pl-11 pr-11"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !email || !password}
                            className="btn-primary w-full justify-center py-3 text-lg font-bold disabled:opacity-50"
                        >
                            {submitting ? (
                                <Activity className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" /> Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Quick-Login Cards */}
                    <div className="mt-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-xs text-muted uppercase tracking-widest">Demo Accounts</span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Super Admin", email: "super@litsense.in", pw: "admin123", color: "#E11D48" },
                                { label: "Hospital Admin", email: "admin@aluva.in", pw: "admin123", color: "#0891B2" },
                                { label: "Doctor", email: "dr.priya@aluva.in", pw: "doctor123", color: "#10B981" },
                                { label: "Receptionist", email: "reception@aluva.in", pw: "reception123", color: "#F59E0B" },
                            ].map((demo) => (
                                <button
                                    key={demo.email}
                                    onClick={() => handleDemoLogin(demo.email, demo.pw)}
                                    disabled={submitting}
                                    className="card border text-left group transition-all hover:-translate-y-0.5 py-3 px-4"
                                    style={{ borderColor: "transparent" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = demo.color)}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
                                >
                                    <div className="h-2 w-2 rounded-full mb-2" style={{ background: demo.color }} />
                                    <p className="text-sm font-bold">{demo.label}</p>
                                    <p className="text-xs text-muted truncate">{demo.email}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
