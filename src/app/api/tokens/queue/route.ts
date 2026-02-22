import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Token from "@/lib/models/Token";
import { resolveTenant, isTenantError } from "@/lib/tenant";

// GET /api/tokens/queue?doctorId= — Live queue (tenant-scoped)
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const tenant = await resolveTenant(req);
        if (isTenantError(tenant)) return tenant;

        const { searchParams } = new URL(req.url);
        const doctorId = searchParams.get("doctorId");

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const filter: Record<string, unknown> = {
            hospitalId: tenant.hospitalId,
            status: { $in: ["waiting", "called", "serving"] },
            issuedAt: { $gte: todayStart, $lte: todayEnd },
        };

        if (doctorId) filter.doctorId = doctorId;

        const tokens = await Token.find(filter)
            .populate("doctorId", "name specialisation roomNumber")
            .sort({ priority: 1 });

        const queue = tokens.map((t) => ({
            ...t.toObject(),
            estimatedWaitTime: t.estimatedWaitMin,
            priority: t.tokenType === "walkin" ? "walk-in" : "appointment",
        }));

        return NextResponse.json(queue);
    } catch (error: any) {
        console.error("[tokens/queue]", error);
        return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
    }
}
