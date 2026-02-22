import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Token from "@/lib/models/Token";
import TokenAuditLog from "@/lib/models/TokenAuditLog";

// PUT /api/tokens/[id]/skip — Move to end of queue
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json().catch(() => ({}));

        const currentToken = await Token.findById(id);
        if (!currentToken) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 });
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const maxPriorityToken = await Token.findOne({
            hospitalId: currentToken.hospitalId,
            doctorId: currentToken.doctorId,
            status: { $in: ["waiting", "called", "serving"] },
            issuedAt: { $gte: todayStart, $lte: todayEnd },
        }).sort({ priority: -1 });

        const newPriority = (maxPriorityToken?.priority || 0) + 1;

        const token = await Token.findByIdAndUpdate(
            id,
            { status: "waiting", priority: newPriority },
            { new: true }
        );

        await TokenAuditLog.create({
            hospitalId: currentToken.hospitalId,
            tokenId: currentToken._id,
            action: "skipped",
            performedBy: body.performedBy || "doctor",
            notes: `Moved to position ${newPriority}`,
        });

        return NextResponse.json(token);
    } catch (error) {
        return NextResponse.json({ error: "Failed to skip token" }, { status: 500 });
    }
}
