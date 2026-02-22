import { NextResponse } from "next/server";

// POST /api/hms/sync-appointments — Pull appointments from external HMS
export async function POST() {
    // Stub: HMS integration placeholder
    return NextResponse.json({
        message: "HMS sync endpoint ready. Configure HMS adapter for integration.",
        synced: 0,
    });
}
