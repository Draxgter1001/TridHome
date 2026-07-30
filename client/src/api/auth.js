import { api, clearTokens, setTokens } from "./client";

export async function login(email, password) {
  const tokens = await api("/auth/login/", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  setTokens(tokens);
  return api("/auth/me/");
}

export async function register(payload) {
  const data = await api("/auth/register/", {
    method: "POST",
    body: payload,
    auth: false,
  });
  setTokens(data);
  return data.user;
}

export const me = () => api("/auth/me/");
export const logout = () => clearTokens();
