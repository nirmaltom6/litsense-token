import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDoctor extends Document {
    hospitalId: Types.ObjectId;
    name: string;
    specialisation: string;
    department?: string;
    roomNumber?: string;
    avatarUrl?: string;
    isActive: boolean;
    createdAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
    {
        hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
        name: { type: String, required: true, maxlength: 120 },
        specialisation: { type: String, required: true, maxlength: 80 },
        department: { type: String, maxlength: 80 },
        roomNumber: { type: String, maxlength: 20 },
        avatarUrl: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

DoctorSchema.index({ hospitalId: 1, isActive: 1 });
DoctorSchema.index({ hospitalId: 1, specialisation: 1 });

const Doctor: Model<IDoctor> =
    mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);

export default Doctor;
