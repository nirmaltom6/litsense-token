import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHospital extends Document {
    name: string;
    slug: string;               // URL-safe identifier (aluva-general, ernakulam-medical)
    logo?: string;
    brandColor: string;         // Primary brand hex
    brandColorSecondary?: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    subscription: "free" | "pro" | "enterprise";
    maxDoctors: number;
    maxTokensPerDay: number;
    createdAt: Date;
}

const HospitalSchema = new Schema<IHospital>(
    {
        name: { type: String, required: true, maxlength: 200 },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        logo: { type: String },
        brandColor: { type: String, default: "#0891B2" },
        brandColorSecondary: { type: String, default: "#10B981" },
        address: { type: String },
        phone: { type: String },
        email: { type: String },
        isActive: { type: Boolean, default: true },
        subscription: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
        maxDoctors: { type: Number, default: 10 },
        maxTokensPerDay: { type: Number, default: 200 },
    },
    { timestamps: true }
);

HospitalSchema.index({ slug: 1 }, { unique: true });
HospitalSchema.index({ isActive: 1 });

const Hospital: Model<IHospital> =
    mongoose.models.Hospital || mongoose.model<IHospital>("Hospital", HospitalSchema);

export default Hospital;
