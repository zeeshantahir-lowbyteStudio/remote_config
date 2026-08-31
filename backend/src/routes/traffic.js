const express = require("express");
const { eq, and, gte, lte, sql } = require("drizzle-orm");
const { db } = require("../db");
const { apps, requestLogs } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();


router.get("/:id/stats", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { from, to, groupBy = "day", action } = req.query;

  const [app] = await db.select().from(apps).where(eq(apps.id, id));
  if (!app) return res.status(404).json({ error: "App not found" });

  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate   = to   ? new Date(to)   : new Date();
  toDate.setHours(23, 59, 59, 999);

  const formatMap = {
    minute: "%Y-%m-%d %H:%i",
    hour:   "%Y-%m-%d %H:00",
    day:    "%Y-%m-%d",
    week:   "%Y-%u",      
    month:  "%Y-%m",
  };
  const fmt = formatMap[groupBy] || formatMap.day;

  const filters = [
    eq(requestLogs.appId, Number(id)),
    gte(requestLogs.createdAt, fromDate),
    lte(requestLogs.createdAt, toDate),
  ];
  if (action && action !== "all") {
    filters.push(eq(requestLogs.action, action));
  }

  const timeSeries = await db
    .select({
      period:  sql`DATE_FORMAT(${requestLogs.createdAt}, ${fmt})`.as("period"),
      total:   sql`COUNT(*)`.as("total"),
      success: sql`SUM(CASE WHEN ${requestLogs.statusCode} < 400 THEN 1 ELSE 0 END)`.as("success"),
      errors:  sql`SUM(CASE WHEN ${requestLogs.statusCode} >= 400 THEN 1 ELSE 0 END)`.as("errors"),
    })
    .from(requestLogs)
    .where(and(...filters))
    .groupBy(sql`DATE_FORMAT(${requestLogs.createdAt}, ${fmt})`)
    .orderBy(sql`DATE_FORMAT(${requestLogs.createdAt}, ${fmt})`);

  const [totals] = await db
    .select({
      total:        sql`COUNT(*)`.as("total"),
      success:      sql`SUM(CASE WHEN ${requestLogs.statusCode} < 400 THEN 1 ELSE 0 END)`.as("success"),
      errors:       sql`SUM(CASE WHEN ${requestLogs.statusCode} >= 400 THEN 1 ELSE 0 END)`.as("errors"),
      uniqueUsers:  sql`COUNT(DISTINCT ${requestLogs.userId})`.as("uniqueUsers"),
    })
    .from(requestLogs)
    .where(and(...filters));

  const byAction = await db
    .select({
      action: requestLogs.action,
      total:  sql`COUNT(*)`.as("total"),
    })
    .from(requestLogs)
    .where(and(...filters))
    .groupBy(requestLogs.action);

  const byPlatform = await db
    .select({
      platform: requestLogs.platform,
      total:    sql`COUNT(*)`.as("total"),
    })
    .from(requestLogs)
    .where(and(...filters))
    .groupBy(requestLogs.platform);

  res.json({
    app: { id: app.id, name: app.name, logRetentionDays: app.logRetentionDays },
    range: { from: fromDate.toISOString(), to: toDate.toISOString(), groupBy },
    summary: {
      total:       Number(totals?.total       ?? 0),
      success:     Number(totals?.success     ?? 0),
      errors:      Number(totals?.errors      ?? 0),
      uniqueUsers: Number(totals?.uniqueUsers ?? 0),
    },
    timeSeries: timeSeries.map((r) => ({
      period:  r.period,
      total:   Number(r.total),
      success: Number(r.success),
      errors:  Number(r.errors),
    })),
    byAction:   byAction.map((r) => ({ action: r.action,   total: Number(r.total) })),
    byPlatform: byPlatform.map((r) => ({ platform: r.platform ?? "unknown", total: Number(r.total) })),
  });
});

router.put("/:id/retention", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { days } = req.body;

  if (!days || Number(days) < 1) {
    return res.status(400).json({ error: "days must be a positive integer" });
  }

  const [app] = await db.select().from(apps).where(eq(apps.id, id));
  if (!app) return res.status(404).json({ error: "App not found" });

  await db.update(apps).set({ logRetentionDays: Number(days) }).where(eq(apps.id, id));
  res.json({ id: Number(id), logRetentionDays: Number(days) });
});

router.delete("/:id/logs", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { from, to } = req.query;

  const [app] = await db.select().from(apps).where(eq(apps.id, id));
  if (!app) return res.status(404).json({ error: "App not found" });

  const filters = [eq(requestLogs.appId, Number(id))];
  if (from) filters.push(gte(requestLogs.createdAt, new Date(from)));
  if (to)   filters.push(lte(requestLogs.createdAt, new Date(to)));

  await db.delete(requestLogs).where(and(...filters));
  res.json({ success: true });
});

module.exports = router;
