import axios from "axios"; 


const API = axios.create({ 
    baseURL: "http://localhost:3000/api/groups", 
    headers: { "Content-Type": "application/json", Accept: "application/json" } 
}); 


const authHeader = (token) => ({ 
    headers: { Authorization: `Bearer ${token}` } 
}); 

export const createGroup = (groupData, token) => API.post("/", groupData, authHeader(token)); 
export const deleteGroup = (id, token) => API.delete(`/${id}`,authHeader(token)); 

export const getMyGroups = (token) => API.get("/", authHeader(token)); 
export const getGroupById = (groupId, token) => API.get(`/${groupId}`, authHeader(token)); 

export const updateGroup = (groupId, groupData, token) => API.patch(`/${groupId}`, groupData, authHeader(token)); 
export const addMember = (groupId, memberData, token) => API.post(`/${groupId}/members`, memberData, authHeader(token)); 
export const updateMemberRole = (groupId, memberId, roleData, token) => API.patch(`/${groupId}/members/${memberId}/role`, roleData, authHeader(token)); 
export const removeMember = (groupId, memberId, token) => API.delete(`/${groupId}/members/${memberId}`, authHeader(token)); 
export const toggleArchive = (groupId, token) => API.patch(`/${groupId}/archive`, {}, authHeader(token)); 

export default API;