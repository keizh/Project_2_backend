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
app.use(cors(corsOptions));

app.use(express.json());
app.get("/", (req, res) => res.send("Express on Vercel"));

async function exe() {
  try {
    const MONGODBconnectionOBJ = await mongoose.connect(process.env.MONGODB);
    if (MONGODBconnectionOBJ) {
      app.listen(5500, () =>
        console.log("SERVER IS ONLINE WITH MONGODB Connection established")
      );
    } else {
      console.log(`Failed to connect to MongoDB and server not created`);
    }
  } catch (err) {
    console.log(`${err.message}`);
  }
}
exe();

module.exports = app;
