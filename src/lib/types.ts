export interface Hospital {
    _id: string;
    name: string;
    slug: string;
    brandColor: string;
    brandColorSecondary?: string;
    logo?: string;
    isActive: boolean;
    subscription: "free" | "pro" | "enterprise";
}

export interface Doctor {
    _id: string;
    hospitalId?: string;
    name: string;
    specialisation: string;
    department?: string;
    roomNumber: string;
    isActive: boolean;
    maxPatientsPerShift?: number;
}

export interface Appointment {
    _id: string;
    hospitalId?: string;
    patientName: string;
    patientPhone?: string;
    doctorId: Doctor | string;
    appointmentDate: string;
    appointmentTime: string;
    status: "scheduled" | "checked-in" | "cancelled" | "no-show" | "completed" | "in_progress";
    source: "walk-in" | "web" | "reception" | "online" | "hms_sync";
    type?: "scheduled" | "walkin";
    createdAt: string;
}

export interface Token {
    _id: string;
    hospitalId?: string;
    tokenNumber: string;
    patientName: string;
    appointmentId?: string;
    doctorId: Doctor | string;
    priority: "emergency" | "appointment" | "walk-in";
    status: "waiting" | "called" | "serving" | "completed" | "no-show" | "cancelled" | "skipped";
    tokenType?: "scheduled" | "walkin";
    issuedAt: string;
    calledAt?: string;
    servingAt?: string;
    completedAt?: string;
    estimatedWaitTime?: number;
    estimatedWaitMin?: number;
    qrPayload?: string;
}
