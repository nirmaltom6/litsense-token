import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Hospital from "@/lib/models/Hospital";
import Doctor from "@/lib/models/Doctor";
import Schedule from "@/lib/models/Schedule";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/auth";

// POST /api/seed — Seed multi-tenant data + demo users
export async function POST() {
    try {
        await connectDB();

        const existingHospitals = await Hospital.countDocuments();
        if (existingHospitals > 0) {
            return NextResponse.json({ message: "Database already seeded", skipped: true });
        }

        // ── Hospitals ───────────────────────────────────────────
        const aluva = await Hospital.create({
            name: "Aluva General Hospital",
            slug: "aluva-general",
            brandColor: "#0891B2",
            brandColorSecondary: "#10B981",
            address: "MG Road, Aluva, Kerala 683101",
            phone: "+91 484 2624000",
            email: "admin@aluvageneral.in",
            subscription: "pro",
            maxDoctors: 20,
            maxTokensPerDay: 500,
        });

        const ernakulam = await Hospital.create({
            name: "Ernakulam Medical Center",
            slug: "ernakulam-medical",
            brandColor: "#7C3AED",
            brandColorSecondary: "#F59E0B",
            address: "NH Bypass, Ernakulam, Kerala 682028",
            phone: "+91 484 2801234",
            email: "admin@ernakulammedical.in",
            subscription: "enterprise",
            maxDoctors: 50,
            maxTokensPerDay: 1000,
        });

        // ── Doctors ─────────────────────────────────────────────
        const aluvaDoctors = await Doctor.insertMany([
            { hospitalId: aluva._id, name: "Priya Menon", specialisation: "Anaesthesiology", department: "Anaesthesia", roomNumber: "A-101", isActive: true },
            { hospitalId: aluva._id, name: "Rajan Nair", specialisation: "Anaesthesiology", department: "Anaesthesia", roomNumber: "A-102", isActive: true },
            { hospitalId: aluva._id, name: "Kavitha Das", specialisation: "Anaesthesiology", department: "Anaesthesia", roomNumber: "A-103", isActive: true },
            { hospitalId: aluva._id, name: "Arun Kumar", specialisation: "Cardiology", department: "Cardiology", roomNumber: "C-201", isActive: true },
            { hospitalId: aluva._id, name: "Sunita Patel", specialisation: "Orthopaedics", department: "Ortho", roomNumber: "O-301", isActive: true },
        ]);

        const ernDoctors = await Doctor.insertMany([
            { hospitalId: ernakulam._id, name: "George Thomas", specialisation: "Neurology", department: "Neurology", roomNumber: "N-101", isActive: true },
            { hospitalId: ernakulam._id, name: "Fatima Zahra", specialisation: "General Medicine", department: "Medicine", roomNumber: "M-201", isActive: true },
            { hospitalId: ernakulam._id, name: "Deepak Menon", specialisation: "Anaesthesiology", department: "Anaesthesia", roomNumber: "A-301", isActive: true },
            { hospitalId: ernakulam._id, name: "Amrita Singh", specialisation: "Paediatrics", department: "Paediatrics", roomNumber: "P-101", isActive: true },
            { hospitalId: ernakulam._id, name: "Suresh Babu", specialisation: "ENT", department: "ENT", roomNumber: "E-101", isActive: true },
        ]);

        // ── Schedules ───────────────────────────────────────────
        const allDoctors = [...aluvaDoctors, ...ernDoctors];
        const scheduleData = allDoctors.flatMap((doc) =>
            [1, 2, 3, 4, 5].map((day) => ({
                hospitalId: doc.hospitalId,
                doctorId: doc._id,
                dayOfWeek: day,
                startTime: "09:00",
                endTime: "17:00",
                slotDurationMin: 15,
                maxAppointments: 20,
                maxWalkins: 5,
                isActive: true,
            }))
        );
        await Schedule.insertMany(scheduleData);

        // ── User Accounts ───────────────────────────────────────
        const superPw = await hashPassword("admin123");
        const adminPw = await hashPassword("admin123");
        const doctorPw = await hashPassword("doctor123");
        const receptionPw = await hashPassword("reception123");

        await User.insertMany([
            // Super Admin (no hospital)
            {
                email: "super@litsense.in",
                name: "Super Admin",
                passwordHash: superPw,
                role: "SUPER_ADMIN",
                hospitalId: aluva._id,   // required but SA can access all
            },

            // Aluva Hospital Admin
            {
                hospitalId: aluva._id,
                email: "admin@aluva.in",
                name: "Aluva Admin",
                passwordHash: adminPw,
                role: "HOSPITAL_ADMIN",
            },
            // Aluva Doctor (linked to Dr. Priya)
            {
                hospitalId: aluva._id,
                email: "dr.priya@aluva.in",
                name: "Dr. Priya Menon",
                passwordHash: doctorPw,
                role: "DOCTOR",
                doctorId: aluvaDoctors[0]._id,
            },
            // Aluva Receptionist
            {
                hospitalId: aluva._id,
                email: "reception@aluva.in",
                name: "Aluva Reception",
                passwordHash: receptionPw,
                role: "RECEPTIONIST",
            },

            // Ernakulam Hospital Admin
            {
                hospitalId: ernakulam._id,
                email: "admin@ernakulam.in",
                name: "Ernakulam Admin",
                passwordHash: adminPw,
                role: "HOSPITAL_ADMIN",
            },
            // Ernakulam Doctor
            {
                hospitalId: ernakulam._id,
                email: "dr.george@ernakulam.in",
                name: "Dr. George Thomas",
                passwordHash: doctorPw,
                role: "DOCTOR",
                doctorId: ernDoctors[0]._id,
            },
            // Ernakulam Receptionist
            {
                hospitalId: ernakulam._id,
                email: "reception@ernakulam.in",
                name: "Ernakulam Reception",
                passwordHash: receptionPw,
                role: "RECEPTIONIST",
            },
        ]);

        return NextResponse.json({
            message: "Multi-tenant database seeded with RBAC users",
            created: {
                hospitals: 2,
                doctors: { aluva: aluvaDoctors.length, ernakulam: ernDoctors.length },
                schedules: scheduleData.length,
                users: 7,
            },
            demoAccounts: [
                { role: "SUPER_ADMIN", email: "super@litsense.in", password: "admin123" },
                { role: "HOSPITAL_ADMIN", email: "admin@aluva.in", password: "admin123" },
                { role: "DOCTOR", email: "dr.priya@aluva.in", password: "doctor123" },
                { role: "RECEPTIONIST", email: "reception@aluva.in", password: "reception123" },
                { role: "HOSPITAL_ADMIN", email: "admin@ernakulam.in", password: "admin123" },
                { role: "DOCTOR", email: "dr.george@ernakulam.in", password: "doctor123" },
                { role: "RECEPTIONIST", email: "reception@ernakulam.in", password: "reception123" },
            ],
        });
    } catch (error: any) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message || "Failed to seed database" }, { status: 500 });
    }
}

// GET /api/seed — Status check
export async function GET() {
    try {
        await connectDB();
        const hospitals = await Hospital.find().select("name slug");
        const doctorCount = await Doctor.countDocuments();
        const userCount = await User.countDocuments();
        return NextResponse.json({ seeded: hospitals.length > 0, hospitals, totalDoctors: doctorCount, totalUsers: userCount });
    } catch (error) {
        return NextResponse.json({ error: "Failed to check seed status" }, { status: 500 });
    }
}
