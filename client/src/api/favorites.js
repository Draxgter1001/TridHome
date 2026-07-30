import { api } from "./client";

export const fetchFavorites = () => api("/favorites/");
export const fetchFavoriteIds = () => api("/favorites/ids/");
export const toggleFavorite = (body) =>
  api("/favorites/toggle/", { method: "POST", body });
