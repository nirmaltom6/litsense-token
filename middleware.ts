import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "litsense-jwt-secret-d7f8a9b0c1e2-change-me-in-prod"
);

// ── Protected route patterns ────────────────────────────────────
const ROLE_ROUTES: Record<string, RegExp[]> = {
    SUPER_ADMIN: [/^\/super-admin/],
    HOSPITAL_ADMIN: [/^\/h\/[^/]+\/admin/],
    DOCTOR: [/^\/h\/[^/]+\/doctor/],
    RECEPTIONIST: [/^\/h\/[^/]+\/reception/],
};

// Routes that bypass auth entirely
const PUBLIC_ROUTES = [
    /^\/$/,
    /^\/login/,
    /^\/track/,
    /^\/demo/,
    /^\/api\/auth\//,
    /^\/api\/seed/,
    /^\/api\/hospitals/,
    /^\/h\/[^/]+\/display/,        // Public display lobby
    /^\/_next/,
    /^\/favicon/,
];

// API routes that need auth but handle it themselves
const API_SELF_AUTH = /^\/api\/(admin|doctors|tokens|appointments)/;

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Skip public routes
    if (PUBLIC_ROUTES.some((r) => r.test(pathname))) {
        return NextResponse.next();
    }

    // Skip API routes — they use requireAuth() internally
    if (API_SELF_AUTH.test(pathname)) {
        return NextResponse.next();
    }

    // Extract JWT
    const token = req.cookies.get("litsense_token")?.value;

    if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = payload.role as string;
        const hospitalSlug = payload.hospitalSlug as string | null;

        // Check if user has access to this specific route
        const isProtected = Object.entries(ROLE_ROUTES).some(([_, patterns]) =>
            patterns.some((p) => p.test(pathname))
        );

        if (isProtected) {
            const allowed = ROLE_ROUTES[role];
            if (!allowed) {
                return NextResponse.redirect(new URL("/login", req.url));
            }

            const hasAccess = allowed.some((p) => p.test(pathname));

            // SUPER_ADMIN can access everything
            if (!hasAccess && role !== "SUPER_ADMIN") {
                // Hospital admin/doctor/receptionist trying to access a different role's route
                const correctPath = role === "HOSPITAL_ADMIN"
                    ? `/h/${hospitalSlug}/admin`
                    : role === "DOCTOR"
                        ? `/h/${hospitalSlug}/doctor`
                        : `/h/${hospitalSlug}/reception`;

                return NextResponse.redirect(new URL(correctPath, req.url));
            }

            // Tenant isolation: ensure user can only access their own hospital slug
            if (role !== "SUPER_ADMIN" && hospitalSlug) {
                const slugMatch = pathname.match(/^\/h\/([^/]+)/);
                if (slugMatch && slugMatch[1] !== hospitalSlug) {
                    // Attempting to access another hospital
                    const correctPath = role === "HOSPITAL_ADMIN"
                        ? `/h/${hospitalSlug}/admin`
                        : role === "DOCTOR"
                            ? `/h/${hospitalSlug}/doctor`
                            : `/h/${hospitalSlug}/reception`;
                    return NextResponse.redirect(new URL(correctPath, req.url));
                }
            }
        }

        // Add user info to request headers for downstream use
        const response = NextResponse.next();
        response.headers.set("x-user-id", payload.userId as string);
        response.headers.set("x-user-role", role);
        if (payload.hospitalId) response.headers.set("x-hospital-id", payload.hospitalId as string);
        if (hospitalSlug) response.headers.set("x-hospital-slug", hospitalSlug);

        return response;
    } catch {
        // Invalid/expired JWT
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("redirect", pathname);

        const response = NextResponse.redirect(loginUrl);
        response.cookies.set("litsense_token", "", { maxAge: 0, path: "/" });
        return response;
    }
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
