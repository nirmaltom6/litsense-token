import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Doctor from "@/lib/models/Doctor";

// GET /api/doctors/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
        }
        return NextResponse.json(doctor);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch doctor" }, { status: 500 });
    }
}

// PUT /api/doctors/[id]
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();
        const doctor = await Doctor.findByIdAndUpdate(id, body, { new: true });
        if (!doctor) {
            return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
        }
        return NextResponse.json(doctor);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
    }
}
