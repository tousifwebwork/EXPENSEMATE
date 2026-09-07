
import axios from "axios";

const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_DEV
  : import.meta.env.VITE_API_URL_PROD;

const API = axios.create({
  baseURL: `${API_URL}/api/expenses`,
});

// Authorization header
const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});


// CREATE EXPENSE
export const createExpense = (expenseData, token) => {
  return API.post("/", expenseData, authHeader(token));
};


// GET ALL EXPENSES FOR GROUP
export const getGroupExpenses = (groupId, token) => {
  return API.get(`/group/${groupId}`, authHeader(token));
};


// GET SINGLE EXPENSE
export const getExpenseById = (expenseId, token) => {
  return API.get(`/${expenseId}`, authHeader(token));
};


// UPDATE EXPENSE
export const updateExpense = (expenseId, expenseData, token) => {
  return API.patch(`/${expenseId}`, expenseData, authHeader(token));
};


// DELETE EXPENSE
export const deleteExpense = (expenseId, token) => {
  return API.delete(`/${expenseId}`, authHeader(token));
};
