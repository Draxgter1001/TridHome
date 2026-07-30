import { api } from "./client";

export const fetchReviews = (targetId) =>
  api(`/reviews/?target=${targetId}`, { auth: false });

export const createReview = (target, rating, text) =>
  api("/reviews/", { method: "POST", body: { target, rating, text } });
