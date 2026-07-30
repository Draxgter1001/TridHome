import { api } from "./client";

export const tridChat = (messages) =>
  api("/ai/chat/", { method: "POST", body: { messages }, auth: false });
