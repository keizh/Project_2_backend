require("dotenv").config();

const { createServer } = require("http");
const { Server } = require("socket.io");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const userRoutes = require(`../Routes/userRoutes`);
const postRoutes = require(`../Routes/postRoutes`);
const bookmarkRoutes = require(`../Routes/bookmarkRoutes`);
var connected = false;
const dbConnect = require("../db/dbConnect");
// exe function will handle db connecton and will turn connected to true
dbConnect();

const corsOptions = {
  origin: "*", // or an array of allowed origins like ['http://localhost:5173', 'http://example.com']
  methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"], // Correct header names
  //   credentials: true, // Uncomment if you need to send cookies with requests
  optionsSuccessStatus: 204, // Use 204 for successful preflight requests
};

// middleware for cross origin resoure sharing
app.use(cors(corsOptions));
// middleware to parse body
app.use(express.json());
// starting api endpoint
app.get("/", (req, res) => res.send(`Express on Vercel`));
// api-end Point to check if db is connected
app.get("/connect", (req, res) => res.send(`Is it connected: ${connected}`));

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/post", postRoutes);
app.use("/api/v1/bookmark", bookmarkRoutes);

app.listen(process.env.PORT, () => console.log("SERVER IS ONLINE"));
