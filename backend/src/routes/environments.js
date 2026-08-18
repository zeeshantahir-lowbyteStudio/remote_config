const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { environments, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const rows = await db.select().from(environments);
  res.json(rows);
});

router.post("/", requireAuth, requireRole("publisher"), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const existing = await db.select().from(environments).where(eq(environments.name, name));
  if (existing.length > 0) return res.status(409).json({ error: "Environment already exists" });

  const [result] = await db.insert(environments).values({ name });
  await db.insert(auditLog).values({ userId: req.user.id, action: "Created environment", target: name });
  res.status(201).json({ id: result.insertId, name });
});

router.delete("/:id", requireAuth, requireRole("publisher"), async (req, res) => {
  const { id } = req.params;
  const [env] = await db.select().from(environments).where(eq(environments.id, id));
  if (!env) return res.status(404).json({ error: "Environment not found" });
  if (env.name === "prod") return res.status(403).json({ error: "prod environment is protected" });

  await db.delete(environments).where(eq(environments.id, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: "Deleted environment", target: env.name });
  res.json({ success: true });
});

module.exports = router;