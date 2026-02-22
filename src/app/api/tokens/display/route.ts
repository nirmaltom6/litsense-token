import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Token from "@/lib/models/Token";
import { resolveTenant, isTenantError } from "@/lib/tenant";

// GET /api/tokens/display?doctorId= (tenant-scoped)
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
            issuedAt: { $gte: todayStart, $lte: todayEnd },
        };
        if (doctorId) filter.doctorId = doctorId;

        const serving = await Token.findOne({
            ...filter,
            status: { $in: ["serving", "called"] },
        })
            .populate("doctorId", "name specialisation roomNumber")
            .sort({ calledAt: -1 });

        const upcoming = await Token.find({
            ...filter,
            status: "waiting",
        })
            .populate("doctorId", "name specialisation roomNumber")
            .sort({ priority: 1 })
            .limit(3);

        const completedCount = await Token.countDocuments({
            ...filter,
            status: "completed",
        });

        const totalActive = await Token.countDocuments({
            ...filter,
            status: { $in: ["waiting", "called", "serving"] },
        });

        return NextResponse.json({ serving, upcoming, completedCount, totalActive });
    } catch (error: any) {
        console.error("[tokens/display]", error);
        return NextResponse.json({ error: "Failed to fetch display data" }, { status: 500 });
    }
}
