const express = require("express");
const cors = require("cors");
const { and, lte, eq, sql } = require("drizzle-orm");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/api/params", require("./routes/params"));
app.use("/api/params", require("./routes/paramConditions"));
app.use("/api/conditions", require("./routes/conditions"));
app.use("/api/environments", require("./routes/environments"));
app.use("/api/apps", require("./routes/apps"));
app.use("/api/apps", require("./routes/traffic"));
app.use("/api/experiments", require("./routes/experiments"));
app.use("/api/history", require("./routes/history"));
app.use("/api/audit-log", require("./routes/auditLog"));
app.use("/api/users", require("./routes/users"));
app.use("/config", require("./routes/config"));
app.use("/api/projects", require("./routes/projects"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startLogCleanupCron();
});
function startLogCleanupCron() {
  const { db } = require("./db");
  const { apps, requestLogs } = require("./db/schema");

  async function cleanup() {
    try {
      const allApps = await db.select({ id: apps.id, logRetentionDays: apps.logRetentionDays }).from(apps);
      for (const app of allApps) {
        const cutoff = new Date(Date.now() - app.logRetentionDays * 24 * 60 * 60 * 1000);
        await db.delete(requestLogs).where(
          and(eq(requestLogs.appId, app.id), lte(requestLogs.createdAt, cutoff))
        );
      }
      console.log(`[cron] Log cleanup ran at ${new Date().toISOString()}`);
    } catch (err) {
      console.error("[cron] Log cleanup error:", err.message);
    }
  }
  cleanup();
  setInterval(cleanup, 60 * 60 * 1000);
}