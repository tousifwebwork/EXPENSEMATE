import axios from "axios";

const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_DEV
  : import.meta.env.MY_VITE_API_URL_PROD;
const NOTIFICATION_API_URL = `${API_URL}/api/notifications`;

export const getNotifications = async (token) => {
  return axios.get(NOTIFICATION_API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const markAsRead = async (notificationId, token) => {
  return axios.patch(
    `${NOTIFICATION_API_URL}/${notificationId}/read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const markAllAsRead = async (token) => {
  return axios.patch(
    `${NOTIFICATION_API_URL}/read-all`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
};