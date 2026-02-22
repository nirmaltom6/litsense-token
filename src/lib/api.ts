const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  // Default content-type
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Client-side tenant persistence: automatically inject tenant context
  if (typeof window !== "undefined") {
    const hospitalId = sessionStorage.getItem("hospitalId");
    const hospitalSlug = sessionStorage.getItem("hospitalSlug");

    if (hospitalId && !headers.has("x-hospital-id")) {
      headers.set("x-hospital-id", hospitalId);
    }
    if (hospitalSlug && !headers.has("x-hospital-slug")) {
      headers.set("x-hospital-slug", hospitalSlug);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP Error ${response.status}`);
  }

  const result = await response.json();

  // Handle { success, data } envelope (future-proof) OR plain JSON arrays/objects
  if (result && typeof result === "object" && "success" in result) {
    if (!result.success) throw new Error(result.error || "API returned failure");
    return result.data as T;
  }

  // Plain response — return as-is
  return result as T;
}
