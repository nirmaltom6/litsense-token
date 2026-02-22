import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Hospital from "@/lib/models/Hospital";

/**
 * Tenant context extracted from the request.
 * This is passed to every API handler so queries can be scoped.
 */
export interface TenantContext {
    hospitalId: string;
    hospitalSlug: string;
    hospitalName: string;
}

/**
 * Extracts tenant context from the request.
 *
 * Resolution order:
 *   1. `x-hospital-id` header (API clients / JWT-enriched requests)
 *   2. `x-hospital-slug` header (frontend sends this)
 *   3. `hospitalId` query parameter
 *   4. `hospitalSlug` query parameter
 *   5. Path-based: /h/[slug]/... (future use)
 *
 * Returns TenantContext or a 400/404 error response.
 */
export async function resolveTenant(req: NextRequest): Promise<TenantContext | NextResponse> {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Try direct hospitalId
    const hospitalId =
        req.headers.get("x-hospital-id") ||
        searchParams.get("hospitalId");

    if (hospitalId) {
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital || !hospital.isActive) {
            return NextResponse.json(
                { error: "Hospital not found or inactive" },
                { status: 404 }
            );
        }
        return {
            hospitalId: String(hospital._id),
            hospitalSlug: hospital.slug,
            hospitalName: hospital.name,
        };
    }

    // Try slug-based resolution
    const slug =
        req.headers.get("x-hospital-slug") ||
        searchParams.get("hospitalSlug");

    if (slug) {
        const hospital = await Hospital.findOne({ slug, isActive: true });
        if (!hospital) {
            return NextResponse.json(
                { error: `Hospital '${slug}' not found` },
                { status: 404 }
            );
        }
        return {
            hospitalId: String(hospital._id),
            hospitalSlug: hospital.slug,
            hospitalName: hospital.name,
        };
    }

    // No tenant identifier provided — check if only ONE hospital exists (single-tenant fallback)
    const count = await Hospital.countDocuments({ isActive: true });
    if (count === 1) {
        const hospital = await Hospital.findOne({ isActive: true });
        return {
            hospitalId: String(hospital!._id),
            hospitalSlug: hospital!.slug,
            hospitalName: hospital!.name,
        };
    }

    return NextResponse.json(
        { error: "Missing hospitalId or hospitalSlug. Multi-tenant request requires tenant identifier." },
        { status: 400 }
    );
}

/**
 * Helper: check if resolveTenant returned an error response
 */
export function isTenantError(result: TenantContext | NextResponse): result is NextResponse {
    return result instanceof NextResponse;
}
