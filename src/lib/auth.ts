import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

// ── Constants ───────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "litsense-super-secret-key-change-in-production";
const JWT_EXPIRY = "24h";
const SALT_ROUNDS = 12;

// ── Types ───────────────────────────────────────────────────────
export type UserRole = "SUPER_ADMIN" | "HOSPITAL_ADMIN" | "DOCTOR" | "RECEPTIONIST";

export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    hospitalId: string | null;  // null for SUPER_ADMIN
    hospitalSlug: string | null;
    name: string;
}

export interface AuthContext extends JWTPayload {
    // Convenience helpers populated by middleware
}

// ── Password Hashing ────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}

// ── JWT ─────────────────────────────────────────────────────────
export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

// ── Extract token from request ──────────────────────────────────
function extractToken(req: NextRequest): string | null {
    // 1. Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }

    // 2. Cookie
    const cookie = req.cookies.get("litsense_token");
    if (cookie?.value) {
        return cookie.value;
    }

    return null;
}

// ── Auth Middleware ──────────────────────────────────────────────
/**
 * Validates JWT and returns AuthContext.
 * If invalid, returns a NextResponse error.
 * 
 * Usage in API routes:
 *   const auth = await requireAuth(req, ["DOCTOR", "RECEPTIONIST"]);
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireAuth(
    req: NextRequest,
    allowedRoles?: UserRole[]
): Promise<AuthContext | NextResponse> {
    const token = extractToken(req);
    if (!token) {
        return NextResponse.json(
            { error: "Authentication required. Please log in." },
            { status: 401 }
        );
    }

    const payload = verifyToken(token);
    if (!payload) {
        return NextResponse.json(
            { error: "Invalid or expired token. Please log in again." },
            { status: 401 }
        );
    }

    // Role check
    if (allowedRoles && !allowedRoles.includes(payload.role)) {
        return NextResponse.json(
            { error: `Access denied. Required roles: ${allowedRoles.join(", ")}` },
            { status: 403 }
        );
    }

    return payload;
}

/**
 * Check if requireAuth returned an error response
 */
export function isAuthError(result: AuthContext | NextResponse): result is NextResponse {
    return result instanceof NextResponse;
}

// ── Tenant-scoped auth helper ───────────────────────────────────
/**
 * Validates that the authenticated user can access data for a given hospitalId.
 * SUPER_ADMIN can access any hospital.
 * Everyone else can only access their own hospitalId.
 */
export function canAccessHospital(auth: AuthContext, targetHospitalId: string): boolean {
    if (auth.role === "SUPER_ADMIN") return true;
    return auth.hospitalId === targetHospitalId;
}

// ── Role-based redirect paths ───────────────────────────────────
export function getRedirectPath(role: UserRole, hospitalSlug?: string | null): string {
    switch (role) {
        case "SUPER_ADMIN": return "/super-admin";
        case "HOSPITAL_ADMIN": return `/h/${hospitalSlug}/admin`;
        case "DOCTOR": return `/h/${hospitalSlug}/doctor`;
        case "RECEPTIONIST": return `/h/${hospitalSlug}/reception`;
        default: return "/login";
    }
}
