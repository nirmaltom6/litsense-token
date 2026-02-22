import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { requireAuth, isAuthError, hashPassword } from "@/lib/auth";

// GET /api/admin/users?hospitalId= — List users (SUPER_ADMIN or HOSPITAL_ADMIN for their own)
export async function GET(req: NextRequest) {
    const auth = await requireAuth(req, ["SUPER_ADMIN", "HOSPITAL_ADMIN"]);
    if (isAuthError(auth)) return auth;

    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        let hospitalId = searchParams.get("hospitalId");

        // HOSPITAL_ADMIN can only see their own hospital's users
        if (auth.role === "HOSPITAL_ADMIN") {
            hospitalId = auth.hospitalId;
        }

        const filter: Record<string, unknown> = {};
        if (hospitalId) filter.hospitalId = hospitalId;

        const users = await User.find(filter)
            .select("-passwordHash")
            .populate("hospitalId", "name slug")
            .sort({ role: 1, name: 1 });

        return NextResponse.json(users);
    } catch (error: any) {
        console.error("[admin/users GET]", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// POST /api/admin/users — Create user (SUPER_ADMIN or HOSPITAL_ADMIN)
export async function POST(req: NextRequest) {
    const auth = await requireAuth(req, ["SUPER_ADMIN", "HOSPITAL_ADMIN"]);
    if (isAuthError(auth)) return auth;

    try {
        await connectDB();
        const body = await req.json();

        // HOSPITAL_ADMIN can only create users for their own hospital
        let targetHospitalId = body.hospitalId;
        if (auth.role === "HOSPITAL_ADMIN") {
            targetHospitalId = auth.hospitalId;
            // HOSPITAL_ADMIN cannot create SUPER_ADMIN or other HOSPITAL_ADMIN
            if (body.role === "SUPER_ADMIN" || body.role === "HOSPITAL_ADMIN") {
                return NextResponse.json(
                    { error: "You can only create DOCTOR and RECEPTIONIST accounts" },
                    { status: 403 }
                );
            }
        }

        if (!body.email || !body.password || !body.name || !body.role) {
            return NextResponse.json(
                { error: "email, password, name, and role are required" },
                { status: 400 }
            );
        }

        const passwordHash = await hashPassword(body.password);
        const user = await User.create({
            hospitalId: targetHospitalId,
            email: body.email.toLowerCase().trim(),
            name: body.name,
            passwordHash,
            role: body.role,
            doctorId: body.doctorId || undefined,
        });

        // Return without password hash
        const clean = user.toObject();
        delete (clean as any).passwordHash;

        return NextResponse.json(clean, { status: 201 });
    } catch (error: any) {
        console.error("[admin/users POST]", error);
        if (error.code === 11000) {
            return NextResponse.json(
                { error: "A user with this email already exists in this hospital" },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
    }
}
