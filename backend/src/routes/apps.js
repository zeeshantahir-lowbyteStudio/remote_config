const express = require("express");
const { eq } = require("drizzle-orm");
const crypto = require("crypto");
const { db } = require("../db");
const { apps, environments, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function generateApiKey() {
  return "rc_live_" + crypto.randomBytes(8).toString("hex");
}

router.get("/", requireAuth, async (req, res) => {
  const rows = await db.select().from(apps);
  res.json(rows);
});

router.post("/", requireAuth, requireRole("editor"), async (req, res) => {
  const { name, environment } = req.body;
  if (!name || !environment) return res.status(400).json({ error: "name and environment are required" });

  const [env] = await db.select().from(environments).where(eq(environments.name, environment));
  if (!env) return res.status(404).json({ error: "Environment not found" });

  const apiKey = generateApiKey();
  const [result] = await db.insert(apps).values({ name, apiKey, environmentId: env.id });
  await db.insert(auditLog).values({ userId: req.user.id, action: "Created app", target: name });
  res.status(201).json({ id: result.insertId, name, apiKey, environment });
});

router.post("/:id/regenerate-key", requireAuth, requireRole("editor"), async (req, res) => {
  const { id } = req.params;
  const [app] = await db.select().from(apps).where(eq(apps.id, id));
  if (!app) return res.status(404).json({ error: "App not found" });

  const apiKey = generateApiKey();
  await db.update(apps).set({ apiKey }).where(eq(apps.id, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: "Regenerated API key", target: app.name });
  res.json({ id, apiKey });
});

router.delete("/:id", requireAuth, requireRole("editor"), async (req, res) => {
  const { id } = req.params;
  const [app] = await db.select().from(apps).where(eq(apps.id, id));
  if (!app) return res.status(404).json({ error: "App not found" });

  await db.delete(apps).where(eq(apps.id, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: "Deleted app", target: app.name });
  res.json({ success: true });
});

module.exports = router;