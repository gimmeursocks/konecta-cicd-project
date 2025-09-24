const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.APP_PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  host: "postgres",
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: "postgres",
});

// Ensure table exists
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS history (
      emp_id TEXT NOT NULL,
      week TEXT NOT NULL,
      day TEXT NOT NULL,
      status TEXT NOT NULL,
      PRIMARY KEY (emp_id, week, day)
    )
  `);
};

initDb().catch((err) => {
  console.error("Failed to initialize DB:", err);
  process.exit(1);
});

// Middleware
app.use(bodyParser.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Serve input JSON files
app.use("/input", express.static(path.join(__dirname, "input")));

// Serve output folder (for history.json)
app.use("/output", express.static(path.join(__dirname, "output")));

// API to save history data
app.post("/save-history", async (req, res) => {
  try {
    const data = req.body; // { empId: { week: { day: status } } }

    for (const empId in data) {
      for (const week in data[empId]) {
        for (const day in data[empId][week]) {
          const status = data[empId][week][day];

          await pool.query(
            `
            INSERT INTO history (emp_id, week, day, status)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (emp_id, week, day)
            DO UPDATE SET status = EXCLUDED.status
          `,
            [empId, week, day, status],
          );
        }
      }
    }

    console.log("History successfully saved.");
    res.status(200).send("Saved");
  } catch (err) {
    console.error("Error saving history:", err);
    res.status(500).send("Failed to save history");
  }
});

// API to read history data, acts as output/history.json
app.get("/history", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM history");
    const rows = result.rows; // flat array from Postgres

    // Transform into nested object: { empId: { week: { day: status } } }
    const historyData = {};
    rows.forEach(({ emp_id, week, day, status }) => {
      if (!historyData[emp_id]) historyData[emp_id] = {};
      if (!historyData[emp_id][week]) historyData[emp_id][week] = {};
      historyData[emp_id][week][day] = status;
    });

    res.json(historyData);
    console.log("History successfully read.");
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
