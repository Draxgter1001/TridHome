import { getToken } from "./client";

const BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function uploadVerificationDoc(docType, file) {
  const fd = new FormData();
  fd.append("doc_type", docType);
  fd.append("file", file);
  const res = await fetch(`${BASE}/api/auth/verification-documents/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) throw new Error("Upload non riuscito");
  return res.json();
}

export async function fetchMyDocs() {
  const res = await fetch(`${BASE}/api/auth/verification-documents/`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Errore");
  return res.json();
}

export async function uploadListingImage(listingId, file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${BASE}/api/listings/${listingId}/images/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) throw new Error("Upload foto non riuscito");
  return res.json();
}
