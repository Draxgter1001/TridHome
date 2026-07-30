import { api } from "./client";

export function fetchListings(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) params.append(k, v);
  });
  return api(`/listings/?${params}`, { auth: false });
}

export const fetchListing = (id) => api(`/listings/${id}/`, { auth: false });

export const createListing = (payload) =>
  api("/listings/", { method: "POST", body: payload });
