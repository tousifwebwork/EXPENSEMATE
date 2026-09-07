import axios from "axios";

const API_URL = [process.env.VITE_API_URL_DEV + "/api/notifications", process.env.VITE_API_URL_PROD + "/api/notifications"]; // adjust to your base URL

export const getNotifications = async (token) => {
  return axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const markAsRead = async (notificationId, token) => {
  return axios.patch(
    `${API_URL}/${notificationId}/read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const markAllAsRead = async (token) => {
  return axios.patch(
    `${API_URL}/read-all`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};