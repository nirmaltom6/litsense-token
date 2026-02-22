import { NextResponse } from "next/server";

// POST /api/hms/push-status — Push token status to HMS
export async function POST() {
    return NextResponse.json({
        message: "HMS push endpoint ready. Configure HMS adapter for integration.",
        pushed: 0,
    });
}
