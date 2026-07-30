import { api } from "./client";

export const fetchNotifications = () => api("/notifications/");
export const fetchUnreadCount = () => api("/notifications/unread_count/");
export const markAllRead = () => api("/notifications/mark_all_read/", { method: "POST" });
