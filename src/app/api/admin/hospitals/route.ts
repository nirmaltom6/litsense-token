import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Hospital from "@/lib/models/Hospital";
import User from "@/lib/models/User";
import Doctor from "@/lib/models/Doctor";
import Token from "@/lib/models/Token";
import { requireAuth, isAuthError, hashPassword } from "@/lib/auth";

// GET /api/admin/hospitals — List all hospitals with stats (SUPER_ADMIN only)
export async function GET(req: NextRequest) {
    const auth = await requireAuth(req, ["SUPER_ADMIN"]);
    if (isAuthError(auth)) return auth;

    try {
        await connectDB();
        const hospitals = await Hospital.find().sort({ createdAt: -1 });

        // Enrich with stats
        const enriched = await Promise.all(
            hospitals.map(async (h) => {
                const doctorCount = await Doctor.countDocuments({ hospitalId: h._id });
                const userCount = await User.countDocuments({ hospitalId: h._id });
                const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
                const tokensTodayCount = await Token.countDocuments({
                    hospitalId: h._id,
                    issuedAt: { $gte: todayStart },
                });

                return {
                    ...h.toObject(),
                    stats: { doctors: doctorCount, users: userCount, tokensToday: tokensTodayCount },
                };
            })
        );

        return NextResponse.json(enriched);
    } catch (error: any) {
        console.error("[admin/hospitals GET]", error);
        return NextResponse.json({ error: "Failed to fetch hospitals" }, { status: 500 });
    }
}

// POST /api/admin/hospitals — Register new hospital (SUPER_ADMIN only)
export async function POST(req: NextRequest) {
    const auth = await requireAuth(req, ["SUPER_ADMIN"]);
    if (isAuthError(auth)) return auth;

    try {
        await connectDB();
        const body = await req.json();

        // Create hospital
        const hospital = await Hospital.create({
            name: body.name,
            slug: body.slug,
            brandColor: body.brandColor || "#0891B2",
            brandColorSecondary: body.brandColorSecondary || "#10B981",
            address: body.address || "",
            phone: body.phone || "",
            email: body.email || "",
            subscription: body.subscription || "free",
            maxDoctors: body.maxDoctors || 10,
            maxTokensPerDay: body.maxTokensPerDay || 200,
        });

        // Create default Hospital Admin account if credentials provided
        if (body.adminEmail && body.adminPassword) {
            const passwordHash = await hashPassword(body.adminPassword);
            await User.create({
                hospitalId: hospital._id,
                email: body.adminEmail,
                name: body.adminName || `Admin - ${body.name}`,
                passwordHash,
                role: "HOSPITAL_ADMIN",
            });
        }

        return NextResponse.json(hospital, { status: 201 });
    } catch (error: any) {
        console.error("[admin/hospitals POST]", error);
        if (error.code === 11000) {
            return NextResponse.json({ error: "Hospital slug already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message || "Failed to create hospital" }, { status: 500 });
    }
}
