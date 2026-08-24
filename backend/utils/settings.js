const express = require("express")
const cors = require("cors")
const connectDB = require("../config/db");
require("dotenv").config();

function setup(app){ 
connectDB();
app.use(cors({origin: "http://localhost:5173",credentials: true,}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", require("../router/auth/authRoutes"));
}

module.exports = setup;