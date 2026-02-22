"use client";

import { useParams } from "next/navigation";
import { TenantProvider } from "@/lib/TenantContext";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const slug = params.slug as string;

    return <TenantProvider slug={slug}>{children}</TenantProvider>;
}
