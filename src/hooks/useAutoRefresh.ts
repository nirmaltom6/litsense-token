import { useEffect, useRef } from "react";

/**
 * Runs `callback` once immediately, then every `intervalMs` milliseconds.
 * Clears the interval on unmount or when deps change.
 */
export function useAutoRefresh(callback: () => void, intervalMs: number, enabled = true) {
    const callbackRef = useRef(callback);

    // Keep the ref up-to-date with the latest callback
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled || intervalMs <= 0) return;

        callbackRef.current(); // immediate first call

        const id = setInterval(() => callbackRef.current(), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs, enabled]);
}
