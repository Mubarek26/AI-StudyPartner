const mongoose = require("mongoose");

const connectMongo = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(uri, {
    autoIndex: true
  });
};

module.exports = { connectMongo };
