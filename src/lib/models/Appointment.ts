import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AppointmentType = "scheduled" | "walkin";
export type AppointmentStatus =
    | "booked"
    | "checked_in"
    | "in_progress"
    | "completed"
    | "no_show"
    | "cancelled";
export type AppointmentSource = "reception" | "online" | "hms_sync";

export interface IAppointment extends Document {
    hospitalId: Types.ObjectId;
    patientName: string;
    patientPhone?: string;
    patientUhid?: string;
    doctorId: Types.ObjectId;
    appointmentDate: Date;
    appointmentTime: string;
    type: AppointmentType;
    status: AppointmentStatus;
    notes?: string;
    source: AppointmentSource;
    hmsRefId?: string;
    createdAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
    {
        hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
        patientName: { type: String, required: true, maxlength: 120 },
        patientPhone: { type: String, maxlength: 15 },
        patientUhid: { type: String, maxlength: 30 },
        doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
        appointmentDate: { type: Date, required: true },
        appointmentTime: { type: String, required: true },
        type: {
            type: String,
            enum: ["scheduled", "walkin"],
            required: true,
        },
        status: {
            type: String,
            enum: ["booked", "checked_in", "in_progress", "completed", "no_show", "cancelled"],
            default: "booked",
        },
        notes: { type: String },
        source: {
            type: String,
            enum: ["reception", "online", "hms_sync"],
            default: "reception",
        },
        hmsRefId: { type: String },
    },
    { timestamps: true }
);

AppointmentSchema.index({ hospitalId: 1, doctorId: 1, appointmentDate: 1 });

const Appointment: Model<IAppointment> =
    mongoose.models.Appointment ||
    mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;
