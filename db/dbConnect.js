const mongoose = require(`mongoose`);

async function dbConnect() {
  try {
    const MONGODBconnectionOBJ = await mongoose.connect(process.env.MONGODB);
    if (MONGODBconnectionOBJ) {
      console.log("MONGODB Connection established");
    } else {
      console.log(`Failed to connect to MongoDB and server not created`);
    }
  } catch (err) {
    throw err;
  }
}

module.exports = dbConnect;
