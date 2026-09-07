import axios from "axios";

const API = axios.create({
  baseURL: [process.env.VITE_API_URL_DEV + "/api/user", process.env.VITE_API_URL_PROD + "/api/user"],
  headers: { 
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

export const updateProfileImage = (token, formData) => {return API.patch("/profile/image", formData, authHeader(token));};
export const deleteProfileImage = (token) => {return API.delete("/profile/image",authHeader(token));};


export default API;