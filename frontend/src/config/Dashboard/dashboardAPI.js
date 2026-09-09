import axios from "axios";

<<<<<<< HEAD
  const API = axios.create({
  baseURL: `${
    import.meta.env.MODE === "development"
      ? import.meta.env.VITE_API_URL_DEV
      : import.meta.env.VITE_API_URL_PROD
  }/api/dashboard`,
=======
const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_DEV
  : import.meta.env.VITE_API_URL_PROD;

const API = axios.create({
  baseURL: `${API_URL}/api/dashboard`,
>>>>>>> integration
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