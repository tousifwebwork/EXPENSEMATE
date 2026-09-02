const express = require("express"); 
const setup = require('./utils/settings');

const app = express();
setup(app)
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);
  console.error("🔥 MESSAGE:", err.message);
  console.error("🔥 STACK:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong",
    error: err,
  });
});

app.get("/", (req, res) => {
  res.json({ message: "ExpenseMate API running",});
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});