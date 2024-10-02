require("dotenv").config();
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
async function exe() {
  try {
    await dbConnect();
    connected = true;
  } catch (err) {
    console.log(`${err.message}`);
  }
}
exe();

const corsOptions = {
  origin: ["*"],
  allowedMethods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
  allowedHeaders: ["Content_Type", "Authorization"],
  //   credentials: true,
  successOptionsAllowed: 200,
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

// MAKE SERVER LISTEN
app.listen(process.env.PORT, () => console.log("SERVER IS ONLINE "));
module.exports = app;
