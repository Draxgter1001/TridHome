/** Single fetch wrapper: every network call in the app goes through here.
 *  (Legacy rule broken everywhere: hard-coded localhost URLs in components.) */
const BASE = import.meta.env.VITE_API_BASE_URL || "";

const TOKEN_KEY = "tridhome.access";
const REFRESH_KEY = "tridhome.refresh";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) clearTokens();
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw Object.assign(new Error(detail.detail || `Errore ${res.status}`), {
      status: res.status,
      detail,
    });
  }
  if (res.status === 204) return null;
  return res.json();
}
