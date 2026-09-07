import axios from "axios";

const API = axios.create({
  baseURL: [process.env.VITE_API_URL_DEV + "/api/dashboard", process.env.VITE_API_URL_PROD + "/api/dashboard"],
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