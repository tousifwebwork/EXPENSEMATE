import axios from "axios";

const API = axios.create({
  baseURL: `${
    import.meta.env.MODE === "development"
      ? import.meta.env.VITE_API_URL_DEV
      : import.meta.env.VITE_API_URL_PROD
  }/api/settlements`,
  headers: {
    Accept: "application/json",
  },
});

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Create settlement
export const createSettlement = (token, settlementData) => {
  return API.post("/", settlementData, authHeader(token));
};

// Get all settlements for a group
export const getGroupSettlements = (token, groupId) => {
  return API.get(`/group/${groupId}`, authHeader(token));
};

// Update settlement
export const updateSettlement = (token, settlementId, settlementData) => {
  return API.patch(
    `/${settlementId}`,
    settlementData,
    authHeader(token)
  );
};

// Delete settlement
export const deleteSettlement = (token, settlementId) => {
  return API.delete(`/${settlementId}`, authHeader(token));
};

export default API;