import { NextResponse } from "next/server";

// POST /api/auth/logout — Clear JWT cookie
export async function POST() {
    const response = NextResponse.json({ message: "Logged out successfully" });

    response.cookies.set("litsense_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });

    return response;
}
