import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Token from "@/lib/models/Token";

// GET /api/tokens/[id]/track — Patient self-tracking
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        const token = await Token.findById(id).populate(
            "doctorId",
            "name specialisation roomNumber"
        );
        if (!token) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 });
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Count how many tokens are ahead in the queue
        const peopleAhead = await Token.countDocuments({
            doctorId: token.doctorId,
            status: { $in: ["waiting", "called"] },
            priority: { $lt: token.priority },
            issuedAt: { $gte: todayStart, $lte: todayEnd },
        });

        // Return flat object — UI spreads this directly as TrackData = Token + extras
        return NextResponse.json({
            ...token.toObject(),
            // Alias backend field name to frontend field name
            estimatedWaitTime: token.estimatedWaitMin,
            // Extra tracking fields
            position: peopleAhead + 1,
            peopleAhead,
        });
    } catch (error: any) {
        console.error("[tokens/track]", error);
        return NextResponse.json({ error: "Failed to track token" }, { status: 500 });
    }
}
