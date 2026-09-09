const express = require("express");
const setup = require("./utils/settings");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

setup(app);

app.get("/", (req, res) => {
  res.json({
    message: "ExpenseMate API running",
  });
});

module.exports = app;