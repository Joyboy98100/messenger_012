import axios from "./axios";

export const getAdminDashboard = () => axios.get("/admin/dashboard");

export const getAdminUsers = (page = 1, search = "", limit = 20) =>
  axios.get("/admin/users", {
    params: { page, search, limit },
  });

export const banUser = (userId) =>
  axios.post(`/admin/users/${userId}/ban`);

export const unbanUser = (userId) =>
  axios.post(`/admin/users/${userId}/unban`);

export const deactivateUser = (userId) =>
  axios.post(`/admin/users/${userId}/deactivate`);

export const forceLogoutUser = (userId) =>
  axios.post(`/admin/users/${userId}/force-logout`);

export const getAdminReports = () => axios.get("/admin/reports");

export const handleAdminReport = (reportId, action) =>
  axios.post(`/admin/reports/${reportId}/action`, { action });

