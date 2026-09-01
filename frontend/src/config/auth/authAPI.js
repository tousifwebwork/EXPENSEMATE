import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api/auth",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// REGISTER
export const register = (userData) => {return API.post("/register", userData);};

// LOGIN
export const login = (userData) => {return API.post("/login", userData);};

// LOGOUT
export const logout = () => {return API.post("/logout");};

// GET ME
export const getMe = (token) => {return API.get("/me", {headers: {Authorization: `Bearer ${token}`,},});};


// FORGOT PASSWORD

// STEP 1 - SEND CODE
export const sendVerificationCode = (email) => {return API.post("/forgot-password", {email,});};

// STEP 2 - VERIFY CODE
export const verifyCode = (data) => {return API.post("/verify-code", data);};

// STEP 3 - RESET PASSWORD
export const resetPassword = (data) => {return API.post("/reset-password", data);};   

export default API;