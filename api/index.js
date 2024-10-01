require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
var connected = false;
// const exe = require("../db/exe");
async function exe() {
  try {
    const MONGODBconnectionOBJ = await mongoose.connect(process.env.MONGODB);
    if (MONGODBconnectionOBJ) {
      console.log("MONGODB Connection established");
      connected = true;
    } else {
      console.log(`Failed to connect to MongoDB and server not created`);
    }
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
// middle for cross origin resoure sharing
app.use(cors(corsOptions));
// middleware to parse body
app.use(express.json());
// most basic api-endpoint
app.get("/", (req, res) => res.send(`Express on Vercel`));
app.get("/connect", (req, res) => res.send(`Is it connected: ${connected}`));
const userRoutes = require(`../Routes/userRoutes`);
app.use("/api/v1/user", userRoutes);

// MAKE SERVER LISTEN
app.listen(process.env.PORT, () => console.log("SERVER IS ONLINE "));
module.exports = app;
