let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

export function authHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export function setUser(user: { id?: string; name?: string; role?: string; client_id?: string | null }) {
  localStorage.setItem("bento_user", JSON.stringify(user));
}

export function getUser(): { id?: string; name?: string; role?: string; client_id?: string | null } | null {
  try {
    return JSON.parse(localStorage.getItem("bento_user") || "null");
  } catch {
    return null;
  }
}

export function clearUser() {
  localStorage.removeItem("bento_user");
}

export function clearAuth() {
  clearAccessToken();
  clearUser();
}

export async function refreshSession(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token) {
      setAccessToken(data.access_token);
      if (data.role) setUser({ role: data.role, name: data.name, client_id: data.client_id });
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}
