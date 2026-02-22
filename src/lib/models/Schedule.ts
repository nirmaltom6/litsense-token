import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISchedule extends Document {
    hospitalId: Types.ObjectId;
    doctorId: Types.ObjectId;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDurationMin: number;
    maxAppointments: number;
    maxWalkins: number;
    isActive: boolean;
}

const ScheduleSchema = new Schema<ISchedule>({
    hospitalId: { type: Schema.Types.ObjectId, ref: "Hospital", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDurationMin: { type: Number, default: 15 },
    maxAppointments: { type: Number, default: 20 },
    maxWalkins: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
});

ScheduleSchema.index({ hospitalId: 1, doctorId: 1, dayOfWeek: 1 });

const Schedule: Model<ISchedule> =
    mongoose.models.Schedule || mongoose.model<ISchedule>("Schedule", ScheduleSchema);

export default Schedule;
