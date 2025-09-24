const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { Readable } = require("stream");

const app = express();
const PORT = process.env.APP_PORT || 3000;

// S3 connection
const s3 = new S3Client({ region: process.env.AWS_REGION || "eu-central-1" });
const BUCKET = process.env.S3_BUCKET || "konecta-cicd-project-json-bucket";
const KEY = "output/history.json";

// Middleware
app.use(bodyParser.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Serve input JSON files
app.use("/input", express.static(path.join(__dirname, "input")));

// S3 Helper functions

// Read JSON from S3
async function readHistory() {
  try {
    const data = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
    const body = await streamToString(data.Body);
    return body ? JSON.parse(body) : {};
  } catch (err) {
    if (err.name === "NoSuchKey") return {};
    throw err;
  }
}

// Write JSON to S3
async function writeHistory(json) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
      Body: JSON.stringify(json, null, 2),
      ContentType: "application/json",
    })
  );
}

// Convert stream to string
function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const s = stream instanceof Readable ? stream : Readable.from(stream);
    s.on("data", (chunk) => chunks.push(chunk));
    s.on("error", reject);
    s.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

// API to save history data
app.post("/save-history", async (req, res) => {
  try {
    await writeHistory(req.body);
    console.log("History saved to S3");
    res.status(200).send("Saved");
  } catch (err) {
    console.error("Error saving history:", err);
    res.status(500).send("Failed to save history");
  }
});

// API to read history data, acts as output/history.json
app.get("/history", async (req, res) => {
  try {
    const history = await readHistory();
    res.json(history);
  } catch (err) {
    console.error("Error reading history:", err);
    res.status(500).send("Failed to read history");
  }
});

// Start Server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app; // for testing
