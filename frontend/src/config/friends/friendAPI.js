import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api/friends",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Authorization header
const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});


// SEARCH USERS
export const searchUsers = (query, token) => {
  return API.get(`/search?query=${encodeURIComponent(query)}`, authHeader(token));
};


// SEND FRIEND REQUEST
export const sendRequest = (profileId, token) => {
  return API.post("/request", { profileId }, authHeader(token));
};


// RESPOND TO FRIEND REQUEST ("accept" | "decline")
export const respondToRequest = (requestId, action, token) => {
  return API.patch(`/request/${requestId}`, { action }, authHeader(token));
};


// CANCEL FRIEND REQUEST
export const cancelRequest = (requestId, token) => {
  return API.delete(`/request/${requestId}`, authHeader(token));
};


// GET PENDING REQUESTS (incoming + outgoing)
export const getPendingRequests = (token) => {
  return API.get("/requests/pending", authHeader(token));
};


// GET FRIENDS
export const getFriends = (token) => {
  return API.get("/", authHeader(token));
};


// REMOVE FRIEND
export const removeFriend = (friendId, token) => {
  return API.delete(`/${friendId}`, authHeader(token));
};

export default API;
