import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Token from "@/lib/models/Token";
import TokenAuditLog from "@/lib/models/TokenAuditLog";

// PUT /api/tokens/[id]/delay — Delay slot by N minutes
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const minutes = body.delayMinutes || body.minutes || 10;

        const token = await Token.findById(id);
        if (!token) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 });
        }

        const updatedToken = await Token.findByIdAndUpdate(
            id,
            { estimatedWaitMin: (token.estimatedWaitMin || 0) + minutes },
            { new: true }
        );

        await TokenAuditLog.create({
            hospitalId: token.hospitalId,
            tokenId: token._id,
            action: "delayed",
            performedBy: body.performedBy || "doctor",
            notes: `Delayed by ${minutes} minutes`,
        });

        return NextResponse.json(updatedToken);
    } catch (error) {
        return NextResponse.json({ error: "Failed to delay token" }, { status: 500 });
    }
}
