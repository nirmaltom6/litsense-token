import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Appointment from "@/lib/models/Appointment";

// PUT /api/appointments/[id]/cancel
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status: "cancelled" },
            { new: true }
        );
        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }
        return NextResponse.json(appointment);
    } catch (error) {
        return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
    }
}
