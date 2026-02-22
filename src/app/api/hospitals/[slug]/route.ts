import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Hospital from "@/lib/models/Hospital";

// GET /api/hospitals/[slug] — Resolve hospital by slug (for branding)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        await connectDB();
        const { slug } = await params;

        const hospital = await Hospital.findOne({ slug, isActive: true });
        if (!hospital) {
            return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
        }

        return NextResponse.json(hospital);
    } catch (error: any) {
        console.error("[hospitals/slug]", error);
        return NextResponse.json({ error: "Failed to fetch hospital" }, { status: 500 });
    }
}
