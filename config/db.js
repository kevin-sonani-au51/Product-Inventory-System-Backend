const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection;
    db.on("error", () => console.log("Connection Failed"));
    db.once("open", () => console.log("Database Connected"));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
