const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { connectMongo } = require("./db/mongo");
const { startDailyTips } = require("./services/dailyTips");

const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

// Dummy endpoint to satisfy Render's health checks
app.get("/", (req, res) => res.send("Worker is running..."));
app.get("/health", (req, res) => res.status(200).send("OK"));

connectMongo()
  .then(() => {
    startDailyTips();
    // Start listening so Render doesn't kill the service
    app.listen(PORT, () => {
      console.log(`Worker dummy server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Worker failed to connect to MongoDB", error);
    process.exit(1);
  });
