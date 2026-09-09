import axios from "axios";

// const API_URL = "http://localhost:5000/api/activity"; // adjust to your base URL

const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_DEV
  : import.meta.env.VITE_API_URL_PROD;

const API = axios.create({
  baseURL: `${API_URL}/api/activity`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


export const getGroupActivity = async (groupId, token, page = 1, limit = 15) => {
  return API.get(`/group/${groupId}?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};