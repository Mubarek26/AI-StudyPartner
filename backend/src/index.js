const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const ingestRouter = require("./routes/ingest");
const chatRouter = require("./routes/chat");
const quizRouter = require("./routes/quizRoutes");
const { connectMongo } = require("./db/mongo");
const { startDailyTips } = require("./services/dailyTips");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api", ingestRouter);
app.use("/api", quizRouter);
app.use("/", chatRouter);

const port = process.env.PORT || 4000;

connectMongo()
  .then(() => {
    startDailyTips();
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });
