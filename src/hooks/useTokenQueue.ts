import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Token } from "@/lib/types";

export function useTokenQueue(
  doctorId?: string,
  autoRefreshMs: number = 3000,
  hospitalId?: string
) {
  const [queue, setQueue] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (doctorId) params.set("doctorId", doctorId);
      if (hospitalId) params.set("hospitalId", hospitalId);

      const qs = params.toString();
      const endpoint = `/tokens/queue${qs ? `?${qs}` : ""}`;
      const data = await fetchApi<Token[]>(endpoint);
      setQueue(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId, hospitalId]);

  useEffect(() => {
    fetchQueue();
    if (autoRefreshMs > 0) {
      const interval = setInterval(fetchQueue, autoRefreshMs);
      return () => clearInterval(interval);
    }
  }, [fetchQueue, autoRefreshMs]);

  return { queue, setQueue, loading, error, refresh: fetchQueue };
}
