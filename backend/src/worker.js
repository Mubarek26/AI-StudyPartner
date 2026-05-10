const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { connectMongo } = require("./db/mongo");
const { startDailyTips } = require("./services/dailyTips");

connectMongo()
  .then(() => {
    startDailyTips();
  })
  .catch((error) => {
    console.error("Worker failed to connect to MongoDB", error);
    process.exit(1);
  });
