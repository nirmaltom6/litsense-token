import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AuditAction =
    | "issued"
    | "called"
    | "serving"
    | "completed"
    | "no_show"
    | "delayed"
    | "skipped";

export interface ITokenAuditLog extends Document {
    hospitalId: Types.ObjectId;
    tokenId: Types.ObjectId;
    action: AuditAction;
    performedBy?: string;
    notes?: string;
    timestamp: Date;
}

const TokenAuditLogSchema = new Schema<ITokenAuditLog>({
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
    tokenId: { type: Schema.Types.ObjectId, ref: "Token", required: true },
    action: {
        type: String,
        enum: ["issued", "called", "serving", "completed", "no_show", "delayed", "skipped"],
        required: true,
    },
    performedBy: { type: String },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
});

TokenAuditLogSchema.index({ hospitalId: 1, tokenId: 1, timestamp: -1 });

const TokenAuditLog: Model<ITokenAuditLog> =
    mongoose.models.TokenAuditLog ||
    mongoose.model<ITokenAuditLog>("TokenAuditLog", TokenAuditLogSchema);

export default TokenAuditLog;
