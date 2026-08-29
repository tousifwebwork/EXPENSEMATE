
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api/expenses",
  headers: {
  "Content-Type": "application/json",
  Accept: "application/json",
  },
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
