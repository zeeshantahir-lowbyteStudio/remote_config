const API_BASE = ""; // same-origin — Vite proxy forwards to backend

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("rc_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("rc_token");
    localStorage.removeItem("rc_user");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return null;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}