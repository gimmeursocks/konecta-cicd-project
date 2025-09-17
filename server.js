const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Serve input JSON files
app.use("/input", express.static(path.join(__dirname, "input")));

// Serve output folder (for history.json)
app.use("/output", express.static(path.join(__dirname, "output")));

// API to save history data
app.post("/save-history", (req, res) => {
  const historyPath = path.join(__dirname, "output", "history.json");
  const json = JSON.stringify(req.body, null, 2);

  fs.writeFile(historyPath, json, "utf8", (err) => {
    if (err) {
      console.error("Error saving history.json:", err);
      res.status(500).send("Failed to save history.json");
    } else {
      console.log("History successfully saved.");
      res.status(200).send("Saved");
    }
  });
});

// Start Server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app; // for testing
