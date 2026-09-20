/**
 * Thin fetch wrapper around the portfolio REST API.
 *
 * API_BASE stays empty during local development, where Vite proxies `/api` and
 * `/uploads` to the Express server (see vite.config.ts). For split deployments
 * — Vercel frontend + hosted backend — set VITE_API_URL to the deployed API
 * origin at build time:
 *   VITE_API_URL=https://mariette-portfolio-api.onrender.com
 */
export const API_BASE = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

const TOKEN_KEY = "portfolio-admin-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Builds a fully qualified URL, prefixing uploads with the API base so that
 * uploaded images resolve even when the API is on another origin.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  const value = String(url);

  if (/^https?:\/\//i.test(value)) {
    /* Records saved while running locally can point at localhost — swap the
       origin for the deployed API so those images keep resolving in production. */
    if (API_BASE && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value)) {
      return value.replace(/^https?:\/\/[^/]+/i, API_BASE);
    }
    return value;
  }

  /* Relative paths such as /uploads/… are served by the API origin. */
  if (value.startsWith("/")) return API_BASE + value;
  return value;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", "Bearer " + token);

  let response: Response;
  try {
    response = await fetch(API_BASE + "/api" + path, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      API_BASE
        ? "Cannot reach the API at " +
            API_BASE +
            ". Check that the backend is running and that CLIENT_ORIGIN allows this site."
        : "Cannot reach the server. Make sure the backend is running on port 4000 (npm run dev)."
    );
  }

  let payload: (ApiResponse<unknown> & Record<string, unknown>) | null = null;
  try {
    payload = (await response.json()) as ApiResponse<unknown> &
      Record<string, unknown>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message =
      (payload?.message as string) ||
      "Request failed (" + response.status + ").";
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData }),
};