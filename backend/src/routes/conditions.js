const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { conditions, environments, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const { environment } = req.query;
  if (!environment) return res.status(400).json({ error: "environment query param is required" });

  const [env] = await db.select().from(environments).where(eq(environments.name, environment));
  if (!env) return res.status(404).json({ error: "Environment not found" });

  const rows = await db.select().from(conditions).where(eq(conditions.environmentId, env.id));
  res.json(rows);
});

router.post("/", requireAuth, requireRole("editor"), async (req, res) => {
  const { name, rules, environment } = req.body;
  if (!name || !rules || !environment) return res.status(400).json({ error: "name, rules, environment required" });

  const [env] = await db.select().from(environments).where(eq(environments.name, environment));
  if (!env) return res.status(404).json({ error: "Environment not found" });

  const [result] = await db.insert(conditions).values({ name, ruleExpression: rules, environmentId: env.id });
  await db.insert(auditLog).values({ userId: req.user.id, action: "Created condition", target: name });
  res.status(201).json({ id: result.insertId, name, rules });
});

router.put("/:id", requireAuth, requireRole("editor"), async (req, res) => {
  const { id } = req.params;
  const { name, rules } = req.body;

  const [condition] = await db.select().from(conditions).where(eq(conditions.id, id));
  if (!condition) return res.status(404).json({ error: "Condition not found" });

  await db.update(conditions).set({ name, ruleExpression: rules }).where(eq(conditions.id, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: "Updated condition", target: name });
  res.json({ id, name, rules });
});

router.delete("/:id", requireAuth, requireRole("editor"), async (req, res) => {
  const { id } = req.params;
  const [condition] = await db.select().from(conditions).where(eq(conditions.id, id));
  if (!condition) return res.status(404).json({ error: "Condition not found" });

  await db.delete(conditions).where(eq(conditions.id, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: "Deleted condition", target: condition.name });
  res.json({ success: true });
});

module.exports = router;