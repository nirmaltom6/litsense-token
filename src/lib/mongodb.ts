import mongoose from "mongoose";

// Force IPv4 — prevents ECONNREFUSED on ::1 when Docker maps to 127.0.0.1
const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/litsense-tokens";

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
    global.mongooseCache = cached;
}

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            // Force IPv4 — avoids Node.js resolving localhost → ::1 (IPv6)
            // which Docker does NOT listen on by default
            family: 4,
            // Keep connections alive in Next.js serverless environment
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }).then((m) => m);
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        // Reset so next request can retry
        cached.promise = null;
        throw err;
    }

    return cached.conn;
}

export default connectDB;
