"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface TenantContextType {
    hospitalId: string;
    hospitalSlug: string;
    hospitalName: string;
    brandColor: string;
    loading: boolean;
}

const TenantCtx = createContext<TenantContextType>({
    hospitalId: "",
    hospitalSlug: "",
    hospitalName: "",
    brandColor: "#0891B2",
    loading: true,
});

export function useTenant() {
    return useContext(TenantCtx);
}

export function TenantProvider({
    slug,
    children,
}: {
    slug: string;
    children: ReactNode;
}) {
    const [ctx, setCtx] = useState<TenantContextType>({
        hospitalId: "",
        hospitalSlug: slug,
        hospitalName: "",
        brandColor: "#0891B2",
        loading: true,
    });

    useEffect(() => {
        // Try sessionStorage first
        const cachedId = sessionStorage.getItem("hospitalId");
        const cachedSlug = sessionStorage.getItem("hospitalSlug");
        const cachedName = sessionStorage.getItem("hospitalName");
        const cachedColor = sessionStorage.getItem("brandColor");

        if (cachedId && cachedSlug === slug) {
            setCtx({
                hospitalId: cachedId,
                hospitalSlug: slug,
                hospitalName: cachedName || "",
                brandColor: cachedColor || "#0891B2",
                loading: false,
            });
            return;
        }

        // Fallback: fetch from API
        fetch(`/api/hospitals/${slug}`)
            .then((r) => r.json())
            .then((h) => {
                if (h._id) {
                    sessionStorage.setItem("hospitalId", h._id);
                    sessionStorage.setItem("hospitalSlug", h.slug);
                    sessionStorage.setItem("hospitalName", h.name);
                    sessionStorage.setItem("brandColor", h.brandColor);

                    setCtx({
                        hospitalId: h._id,
                        hospitalSlug: h.slug,
                        hospitalName: h.name,
                        brandColor: h.brandColor || "#0891B2",
                        loading: false,
                    });
                } else {
                    setCtx((prev) => ({ ...prev, loading: false }));
                }
            })
            .catch(() => setCtx((prev) => ({ ...prev, loading: false })));
    }, [slug]);

    return <TenantCtx.Provider value={ctx}>{children}</TenantCtx.Provider>;
}
