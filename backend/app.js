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

if (!process.env.VERCEL) {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
}

module.exports = app;