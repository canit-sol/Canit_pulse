const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("bento_refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await fetch(getApiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("bento_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("bento_refresh_token", data.refresh_token);
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("bento_token");
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise!;
    isRefreshing = false;
    refreshPromise = null;

    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(input, { ...init, headers });
    }
  }

  return response;
}

export default API_BASE_URL;