import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Schedule from "@/lib/models/Schedule";

// GET /api/doctors/[id]/schedules
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const schedules = await Schedule.find({ doctorId: id, isActive: true }).sort({ dayOfWeek: 1 });
        return NextResponse.json(schedules);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
    }
}

// POST /api/doctors/[id]/schedules
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const schedule = await Schedule.create({ ...body, doctorId: id });
        return NextResponse.json(schedule, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
    }
}
