export function getUser(): { id?: string; name?: string; role?: string; client_id?: string | null } | null {
  try {
    return JSON.parse(localStorage.getItem("bento_user") || "null");
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem("bento_token");
  localStorage.removeItem("bento_refresh_token");
  localStorage.removeItem("bento_user");
}
