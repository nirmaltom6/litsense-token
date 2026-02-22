import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Schedule from "@/lib/models/Schedule";

// PUT /api/schedules/[id]
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const schedule = await Schedule.findByIdAndUpdate(id, body, { new: true });
        if (!schedule) {
            return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        }
        return NextResponse.json(schedule);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
    }
}

// DELETE /api/schedules/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        await Schedule.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
    }
}
