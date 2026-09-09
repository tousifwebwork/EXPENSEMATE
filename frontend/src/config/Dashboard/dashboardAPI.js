import axios from "axios";

const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_DEV
  : import.meta.env.VITE_API_URL_PROD;

const API = axios.create({
  baseURL: `${API_URL}/api/dashboard`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});



// Authorization header
const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

 
export const getDashboard = (token) => {return API.get("/", authHeader(token));};
 
export default API;