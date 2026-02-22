import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Token from "@/lib/models/Token";
import TokenAuditLog from "@/lib/models/TokenAuditLog";

// PUT /api/tokens/[id]/serving
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json().catch(() => ({}));

        const token = await Token.findByIdAndUpdate(
            id,
            { status: "serving", servingAt: new Date() },
            { new: true }
        );
        if (!token) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 });
        }

        await TokenAuditLog.create({
            hospitalId: token.hospitalId,
            tokenId: token._id,
            action: "serving",
            performedBy: body.performedBy || "doctor",
        });

        return NextResponse.json(token);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update token" }, { status: 500 });
    }
}
