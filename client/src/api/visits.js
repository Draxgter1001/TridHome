import { api } from "./client";

export const fetchSlots = (listingId) =>
  api(`/slots/?listing=${listingId}`, { auth: false });

export const createSlot = (payload) =>
  api("/slots/", { method: "POST", body: payload });

export const deleteSlot = (id) => api(`/slots/${id}/`, { method: "DELETE" });

export const requestVisit = (slot, message) =>
  api("/visit-requests/", { method: "POST", body: { slot, message } });

export const fetchVisitRequests = (role) =>
  api(`/visit-requests/?role=${role}`);

export const decideVisit = (id, decision) =>
  api(`/visit-requests/${id}/${decision}/`, { method: "POST" });
