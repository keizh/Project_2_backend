const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Express on Vercel"));
app.get("/user", (req, res) => res.send("Express on User"));

app.listen(5500, () => console.log("Server ready on port 3000."));

module.exports = app;
