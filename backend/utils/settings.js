const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
require("dotenv").config();

function setup(app) {
  connectDB();
  app.use(cors({
    origin: (origin, callback) => {
      const configuredOrigins = [
        process.env.CLIENT_URL_DEV,
        process.env.CLIENT_URL_PROD,
        "http://localhost",
        "https://localhost",
        "capacitor://localhost",
        "ionic://localhost",
      ].filter(Boolean);
      const localNetworkOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;

      if (!origin || configuredOrigins.includes(origin) || localNetworkOrigin.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
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
  app.use("/api/notifications", require("../router/notification/notificationRoutes"));
  app.use("/api/reports", require("../router/report/reportRoutes"));
  app.use("/api/activity", require("../router/activity/activityRoutes"));
}

module.exports = setup;