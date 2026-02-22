"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "SUPER_ADMIN" | "HOSPITAL_ADMIN" | "DOCTOR" | "RECEPTIONIST";

export interface AuthUser {
    userId: string;
    name: string;
    email: string;
    role: UserRole;
    hospitalId: string | null;
    hospitalSlug: string | null;
    hospitalName?: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; redirect?: string; error?: string }>;
    logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => ({ success: false }),
    logout: async () => { },
});

export function useAuth() {
    return useContext(AuthCtx);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Check existing session on mount
    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => {
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then((data) => {
                setUser(data);
                setLoading(false);
            })
            .catch(() => {
                // Also try localStorage fallback
                const cached = localStorage.getItem("litsense_user");
                if (cached) {
                    try {
                        setUser(JSON.parse(cached));
                    } catch { }
                }
                setLoading(false);
            });
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || "Login failed" };
            }

            // Store token in localStorage for API calls
            localStorage.setItem("litsense_jwt", data.token);
            localStorage.setItem("litsense_user", JSON.stringify(data.user));

            // Also store in sessionStorage for tenant context
            if (data.user.hospitalId) {
                sessionStorage.setItem("hospitalId", data.user.hospitalId);
                sessionStorage.setItem("hospitalSlug", data.user.hospitalSlug || "");
                sessionStorage.setItem("hospitalName", data.user.hospitalName || "");
            }

            setUser(data.user);

            return { success: true, redirect: data.redirect };
        } catch (err: any) {
            return { success: false, error: err.message || "Network error" };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch { }

        localStorage.removeItem("litsense_jwt");
        localStorage.removeItem("litsense_user");
        sessionStorage.clear();
        setUser(null);
        router.push("/login");
    }, [router]);

    return (
        <AuthCtx.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthCtx.Provider>
    );
}
