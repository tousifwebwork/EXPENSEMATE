const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
require("dotenv").config();

function setup(app) {
  connectDB();

  app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
 

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", require("../router/auth/authRoutes"));
  app.use("/api/user", require("../router/user/userRoutes"));
  app.use("/api/friends", require("../router/friend/friendRoutes"));
  app.use("/api/groups", require("../router/group/groupRoutes"));
  app.use("/api/expenses", require("../router/expense/expenseRoutes"));
  app.use("/api/balance", require("../router/balance/balanceRoutes"));
  app.use("/api/settlements", require("../router/settlement/settlementRoutes"));
  app.use("/api/dashboard", require("../router/dashboard/dashboardRoutes"));
}

module.exports = setup;