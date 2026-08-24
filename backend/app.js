const express = require("express"); 
const setup = require('./utils/settings');

const app = express();
setup(app)

app.get("/", (req, res) => {
  res.json({ message: "ExpenseMate API running",});
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});