import axios from "axios";

const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_DEV
  : import.meta.env.VITE_API_URL_PROD;

const API = axios.create({
<<<<<<< HEAD
  baseURL:
    import.meta.env.MODE === "development"
      ? `${import.meta.env.VITE_API_URL_DEV}/api/auth`
      : `${import.meta.env.VITE_API_URL_PROD}/api/auth`,
=======
  baseURL: `${API_URL}/api/auth`,
>>>>>>> integration
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

export const sent_email_invite = (data,token) => {return API.post("/invite/mail", data,{headers: {Authorization: `Bearer ${token}`,},});};



export default API;