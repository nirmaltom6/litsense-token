import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Doctor from "@/lib/models/Doctor";
import { resolveTenant, isTenantError } from "@/lib/tenant";

// GET /api/doctors — List active doctors (tenant-scoped)
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const tenant = await resolveTenant(req);
        if (isTenantError(tenant)) return tenant;

        const doctors = await Doctor.find({
            hospitalId: tenant.hospitalId,
            isActive: true,
        }).sort({ name: 1 });

        return NextResponse.json(doctors);
    } catch (error: any) {
        console.error("[doctors GET]", error);
        return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
    }
}

// POST /api/doctors — Create a doctor (tenant-scoped)
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const tenant = await resolveTenant(req);
        if (isTenantError(tenant)) return tenant;

        const body = await req.json();
        const doctor = await Doctor.create({
            ...body,
            hospitalId: tenant.hospitalId,
        });
        return NextResponse.json(doctor, { status: 201 });
    } catch (error: any) {
        console.error("[doctors POST]", error);
        return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 });
    }
}
