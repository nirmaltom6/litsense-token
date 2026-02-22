import { IAppointment } from "./models/Appointment";

/**
 * Hybrid Queuing Algorithm
 *
 * For every 3 scheduled patients, 1 walk-in is interleaved.
 * Remaining walk-ins queue at the end.
 * Scheduled patients always have priority but walk-ins get fair gaps.
 */
export function calculateQueue(appointments: IAppointment[]): IAppointment[] {
    const scheduled = appointments
        .filter((a) => a.type === "scheduled")
        .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));

    const walkins = appointments
        .filter((a) => a.type === "walkin")
        .sort(
            (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

    const queue: IAppointment[] = [];
    let walkInIndex = 0;

    for (let i = 0; i < scheduled.length; i++) {
        queue.push(scheduled[i]);

        // Insert a walk-in every 3rd scheduled patient
        if ((i + 1) % 3 === 0 && walkInIndex < walkins.length) {
            queue.push(walkins[walkInIndex]);
            walkInIndex++;
        }
    }

    // Append remaining walk-ins at end
    while (walkInIndex < walkins.length) {
        queue.push(walkins[walkInIndex]);
        walkInIndex++;
    }

    return queue;
}

/**
 * Generate a token number
 * Scheduled: A-001, A-002, ...
 * Walk-in:   W-001, W-002, ...
 */
export function generateTokenNumber(
    type: "scheduled" | "walkin",
    sequence: number
): string {
    const prefix = type === "scheduled" ? "A" : "W";
    return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

/**
 * Estimate wait time based on queue position and slot duration
 */
export function estimateWaitMinutes(
    position: number,
    slotDurationMin: number = 15
): number {
    return Math.max(0, (position - 1) * slotDurationMin);
}
