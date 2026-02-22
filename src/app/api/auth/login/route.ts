import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Hospital from "@/lib/models/Hospital";
import { verifyPassword, signToken, getRedirectPath, JWTPayload } from "@/lib/auth";

// POST /api/auth/login
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user (populate hospital for slug)
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !user.isActive) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Verify password
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Get hospital info for tenant scoping
        let hospitalSlug: string | null = null;
        let hospitalName: string | null = null;
        if (user.hospitalId) {
            const hospital = await Hospital.findById(user.hospitalId);
            if (hospital && !hospital.isActive) {
                return NextResponse.json(
                    { error: "Your hospital account has been deactivated" },
                    { status: 403 }
                );
            }
            hospitalSlug = hospital?.slug || null;
            hospitalName = hospital?.name || null;
        }

        // Build JWT payload
        const payload: JWTPayload = {
            userId: String(user._id),
            email: user.email,
            role: user.role as any,
            hospitalId: user.hospitalId ? String(user.hospitalId) : null,
            hospitalSlug,
            name: user.name,
        };

        const token = signToken(payload);

        // Update last login
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        // Set httpOnly cookie + return token in body
        const redirectPath = getRedirectPath(user.role as any, hospitalSlug);
        const response = NextResponse.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                hospitalId: user.hospitalId ? String(user.hospitalId) : null,
                hospitalSlug,
                hospitalName,
            },
            redirect: redirectPath,
        });

        // Set cookie for SSR/middleware
        response.cookies.set("litsense_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24h
            path: "/",
        });

        return response;
    } catch (error: any) {
        console.error("[auth/login]", error);
        return NextResponse.json(
            { error: "Login failed. Please try again." },
            { status: 500 }
        );
    }
}
