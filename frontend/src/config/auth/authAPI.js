import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api/auth",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Authorization header
const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}`,},
});

export const register = (userData) => { return API.post("/register", userData); };

export const login = (userData) => { return API.post("/login", userData); };

export const logout = () => { return API.post("/logout",); };

export const getMe = (token) => { return API.get("/me", authHeader(token));} ;

export default API;