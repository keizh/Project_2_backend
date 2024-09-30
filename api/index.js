require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.get("/", (req, res) => res.send("Express on Vercel"));
app.get("/user", (req, res) => res.send("Express on User"));

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
