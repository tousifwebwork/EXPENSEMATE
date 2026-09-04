import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api/dashboard",
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