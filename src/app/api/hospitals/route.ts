import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Hospital from "@/lib/models/Hospital";

// GET /api/hospitals — List all active hospitals
export async function GET() {
    try {
        await connectDB();
        const hospitals = await Hospital.find({ isActive: true })
            .select("name slug brandColor brandColorSecondary logo")
            .sort({ name: 1 });
        return NextResponse.json(hospitals);
    } catch (error: any) {
        console.error("[hospitals GET]", error);
        return NextResponse.json({ error: "Failed to fetch hospitals" }, { status: 500 });
    }
}

// GET /api/hospitals/[slug] — Get hospital by slug (for login page branding)
// POST /api/hospitals — Create a hospital (admin only in production)
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const hospital = await Hospital.create(body);
        return NextResponse.json(hospital, { status: 201 });
    } catch (error: any) {
        console.error("[hospitals POST]", error);
        return NextResponse.json({ error: error.message || "Failed to create hospital" }, { status: 500 });
    }
}
