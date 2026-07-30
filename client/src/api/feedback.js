import { api } from "./client";

export const sendFeedback = (text, page) =>
  api("/feedback/", { method: "POST", body: { text, page }, auth: false });
