import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Token from "@/lib/models/Token";
import Appointment from "@/lib/models/Appointment";
import TokenAuditLog from "@/lib/models/TokenAuditLog";
import { generateTokenNumber, estimateWaitMinutes } from "@/lib/queue";
import { resolveTenant, isTenantError } from "@/lib/tenant";

// POST /api/tokens/issue (tenant-scoped)
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const tenant = await resolveTenant(req);
        if (isTenantError(tenant)) return tenant;

        const body = await req.json();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        let doctorId: string;
        let patientName: string;
        let tokenType: "scheduled" | "walkin";
        let appointmentId: string | undefined;

        // Mode 1: Appointment-based
        if (body.appointmentId) {
            const appointment = await Appointment.findOne({
                _id: body.appointmentId,
                hospitalId: tenant.hospitalId,
            }).populate("doctorId", "name roomNumber");
            if (!appointment) {
                return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
            }
            doctorId = String(appointment.doctorId._id ?? appointment.doctorId);
            patientName = appointment.patientName;
            tokenType = appointment.type === "walkin" ? "walkin" : "scheduled";
            appointmentId = String(appointment._id);

            if (appointment.status === "booked") {
                await Appointment.findByIdAndUpdate(body.appointmentId, { status: "checked_in" });
            }
        }
        // Mode 2: Walk-in
        else {
            if (!body.doctorId || !body.patientName) {
                return NextResponse.json(
                    { error: "doctorId and patientName are required" },
                    { status: 400 }
                );
            }
            doctorId = body.doctorId;
            patientName = body.patientName;
            const src = body.priority ?? "walk-in";
            tokenType = src === "appointment" ? "scheduled" : "walkin";
        }

        const existingCount = await Token.countDocuments({
            hospitalId: tenant.hospitalId,
            tokenType,
            issuedAt: { $gte: todayStart, $lte: todayEnd },
        });

        const tokenNumber = generateTokenNumber(tokenType, existingCount + 1);

        const activeCount = await Token.countDocuments({
            hospitalId: tenant.hospitalId,
            doctorId,
            status: { $in: ["waiting", "called", "serving"] },
            issuedAt: { $gte: todayStart, $lte: todayEnd },
        });

        const src = body.priority ?? "walk-in";
        const priorityScore =
            src === "emergency" ? 0 :
                src === "appointment" ? activeCount + 1 :
                    activeCount + 2;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const tokenData: Record<string, unknown> = {
            hospitalId: tenant.hospitalId,
            tokenNumber,
            doctorId,
            patientName,
            tokenType,
            priority: priorityScore,
            estimatedWaitMin: estimateWaitMinutes(activeCount + 1),
            qrPayload: `${appUrl}/track/`,
        };
        if (appointmentId) tokenData.appointmentId = appointmentId;

        const token = await Token.create(tokenData);

        await Token.findByIdAndUpdate(token._id, {
            qrPayload: `${appUrl}/track/${token._id}`,
        });

        await TokenAuditLog.create({
            hospitalId: tenant.hospitalId,
            tokenId: token._id,
            action: "issued",
            performedBy: body.performedBy || "reception",
        });

        const populated = await Token.findById(token._id).populate(
            "doctorId",
            "name specialisation roomNumber"
        );

        return NextResponse.json({
            token: {
                ...populated!.toObject(),
                status: populated!.status,
                priority: src,
                estimatedWaitTime: populated!.estimatedWaitMin,
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error("[tokens/issue]", error);
        return NextResponse.json({ error: error.message || "Failed to issue token" }, { status: 500 });
    }
}
