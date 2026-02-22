import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Appointment from "@/lib/models/Appointment";
import { resolveTenant, isTenantError } from "@/lib/tenant";

// GET /api/appointments?doctorId=&date= (tenant-scoped)
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const tenant = await resolveTenant(req);
        if (isTenantError(tenant)) return tenant;

        const { searchParams } = new URL(req.url);
        const doctorId = searchParams.get("doctorId");
        const date = searchParams.get("date");

        const filter: Record<string, unknown> = {
            hospitalId: tenant.hospitalId,
        };
        if (doctorId) filter.doctorId = doctorId;
        if (date) {
            const d = new Date(date);
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);
            filter.appointmentDate = { $gte: d, $lt: nextDay };
        }

        const appointments = await Appointment.find(filter)
            .populate("doctorId", "name specialisation roomNumber")
            .sort({ appointmentTime: 1 });

        const normalised = appointments.map((a) => ({
            ...a.toObject(),
            status:
                a.status === "checked_in" ? "checked-in" :
                    a.status === "no_show" ? "no-show" :
                        a.status === "booked" ? "scheduled" :
                            a.status,
            source:
                a.source === "reception" ? "walk-in" :
                    a.source === "online" ? "web" :
                        a.source,
        }));

        return NextResponse.json(normalised);
    } catch (error: any) {
        console.error("[appointments GET]", error);
        return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
    }
}

// POST /api/appointments (tenant-scoped)
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const tenant = await resolveTenant(req);
        if (isTenantError(tenant)) return tenant;

        const body = await req.json();

        const normalised = {
            hospitalId: tenant.hospitalId,
            patientName: body.patientName,
            patientPhone: body.patientPhone ?? "",
            doctorId: body.doctorId,
            appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : new Date(),
            appointmentTime: body.appointmentTime ?? "00:00",
            source:
                body.source === "walk-in" ? "reception" :
                    body.source === "web" ? "online" :
                        body.source ?? "reception",
            type: body.type ?? (body.source === "walk-in" ? "walkin" : "walkin"),
            status: "booked",
        };

        const appointment = await Appointment.create(normalised);
        return NextResponse.json(appointment, { status: 201 });
    } catch (error: any) {
        console.error("[appointments POST]", error);
        return NextResponse.json({ error: error.message || "Failed to create appointment" }, { status: 500 });
    }
}
