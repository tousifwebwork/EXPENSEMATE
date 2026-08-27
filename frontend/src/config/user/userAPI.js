import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api/user",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});


// Authorization header
const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});


export const getProfile = (token) => {return API.get("/profile", authHeader(token));};
export const updateProfile = (token, data) => {return API.patch("/profile", data, authHeader(token));};
export const changePassword = (token, data) => {return API.patch("/change-password", data, authHeader(token));};
export const getUserById = (userId, token) => {return API.get(`/individual/${userId}`, authHeader(token));};

export default API;