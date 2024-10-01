require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
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
app.get("/", (req, res) => res.send("Express on Vercel"));
const userRoutes = require(`../Routes/userRoutes`);
app.use("/api/v1/user", userRoutes);

// code to setUp MONGOdb CONNECTION AND MAKE SERVER LISTEN
async function exe() {
  try {
    const MONGODBconnectionOBJ = await mongoose.connect(process.env.MONGODB);
    if (MONGODBconnectionOBJ) {
      console.log("MONGODB Connection established");
    } else {
      console.log(`Failed to connect to MongoDB and server not created`);
    }
  } catch (err) {
    console.log(`${err.message}`);
  }
}
exe();
app.listen(5500, () => console.log("SERVER IS ONLINE "));
module.exports = app;
