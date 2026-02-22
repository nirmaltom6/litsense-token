import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TokenType = "scheduled" | "walkin";
export type TokenStatus =
    | "waiting"
    | "called"
    | "serving"
    | "completed"
    | "no-show"
    | "skipped"
    | "cancelled";

export interface IToken extends Document {
    hospitalId: Types.ObjectId;
    tokenNumber: string;
    appointmentId?: Types.ObjectId;
    doctorId: Types.ObjectId;
    patientName: string;
    tokenType: TokenType;
    priority: number;
    status: TokenStatus;
    estimatedWaitMin?: number;
    calledAt?: Date;
    servingAt?: Date;
    completedAt?: Date;
    issuedAt: Date;
    qrPayload?: string;
}

const TokenSchema = new Schema<IToken>({
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
    tokenNumber: { type: String, required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientName: { type: String, required: true, maxlength: 120 },
    tokenType: {
        type: String,
        enum: ["scheduled", "walkin"],
        required: true,
    },
    priority: { type: Number, required: true },
    status: {
        type: String,
        enum: ["waiting", "called", "serving", "completed", "no-show", "skipped", "cancelled"],
        default: "waiting",
    },
    estimatedWaitMin: { type: Number },
    calledAt: { type: Date },
    servingAt: { type: Date },
    completedAt: { type: Date },
    issuedAt: { type: Date, default: Date.now },
    qrPayload: { type: String },
});

// Tenant-isolated unique token number per day
TokenSchema.index({ hospitalId: 1, tokenNumber: 1, issuedAt: 1 }, { unique: true });
TokenSchema.index({ hospitalId: 1, doctorId: 1, issuedAt: 1 });
TokenSchema.index(
    { hospitalId: 1, status: 1 },
    { partialFilterExpression: { status: { $in: ["waiting", "called", "serving"] } } }
);

const Token: Model<IToken> =
    mongoose.models.Token || mongoose.model<IToken>("Token", TokenSchema);

export default Token;
