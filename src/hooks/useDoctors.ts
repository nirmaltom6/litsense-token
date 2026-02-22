import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Doctor } from "@/lib/types";

export function useDoctors(hospitalId?: string) {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDoctors = useCallback(async () => {
        try {
            // Append hospitalId as query param if provided
            const endpoint = hospitalId
                ? `/doctors?hospitalId=${hospitalId}`
                : "/doctors";
            const data = await fetchApi<Doctor[]>(endpoint);
            setDoctors(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [hospitalId]);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    return { doctors, loading, error, refresh: fetchDoctors };
}
