import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

// GET /api/hms/health — Check HMS adapter connectivity
export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({
            status: "healthy",
            database: "connected",
            hmsAdapter: "not_configured",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: "unhealthy",
                database: "disconnected",
                hmsAdapter: "not_configured",
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        );
    }
}
