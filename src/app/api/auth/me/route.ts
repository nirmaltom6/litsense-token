import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth";

// GET /api/auth/me — Return current user from JWT
export async function GET(req: NextRequest) {
    const auth = await requireAuth(req);
    if (isAuthError(auth)) return auth;

    return NextResponse.json({
        userId: auth.userId,
        name: auth.name,
        email: auth.email,
        role: auth.role,
        hospitalId: auth.hospitalId,
        hospitalSlug: auth.hospitalSlug,
    });
}
