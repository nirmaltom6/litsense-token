import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type UserRole = "SUPER_ADMIN" | "HOSPITAL_ADMIN" | "DOCTOR" | "RECEPTIONIST";

export interface IUser extends Document {
    hospitalId: Types.ObjectId;
    email: string;
    name: string;
    passwordHash: string;
    role: UserRole;
    doctorId?: Types.ObjectId;    // linked doctor profile (for role "doctor")
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        name: { type: String, required: true, maxlength: 120 },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: ["SUPER_ADMIN", "HOSPITAL_ADMIN", "DOCTOR", "RECEPTIONIST"],
            required: true,
        },
        doctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
    },
    { timestamps: true }
);

// Unique per hospital — same email can exist in different hospitals
UserSchema.index({ hospitalId: 1, email: 1 }, { unique: true });
UserSchema.index({ hospitalId: 1, role: 1 });

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
