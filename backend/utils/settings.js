const express = require("express");
const cors = require("cors");
const connectDB = require("../config/db");
require("dotenv").config();

function setup(app) {
  connectDB();

  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("192.168.") ||
        origin.includes("10.0.") ||
        origin.startsWith("capacitor://") ||
        origin === process.env.CLIENT_URL_DEV ||
        origin === process.env.CLIENT_URL_PROD
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Gracefully handle malformed JSON syntax error in request body
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({ success: false, message: "Invalid JSON format in request body" });
    }
    next(err);
  });

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
