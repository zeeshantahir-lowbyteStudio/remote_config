const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { experiments, experimentVariants, experimentEvents, configKeys, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const exps = await db.select().from(experiments);
  const results = [];
  for (const exp of exps) {
    const variants = await db.select().from(experimentVariants).where(eq(experimentVariants.experimentId, exp.id));
    const variantsWithStats = [];
    for (const v of variants) {
      const events = await db.select().from(experimentEvents).where(eq(experimentEvents.variantId, v.id));
      const users = events.filter((e) => e.eventType === "assigned").length;
      const conversions = events.filter((e) => e.eventType === "converted").length;
      variantsWithStats.push({ ...v, users, conversions });
    }
    results.push({ ...exp, variants: variantsWithStats });
  }
  res.json(results);
});

router.post("/", requireAuth, requireRole("editor"), async (req, res) => {
  const { name, paramKey, variants } = req.body;
  if (!name || !paramKey || !Array.isArray(variants) || variants.length < 2) {
    return res.status(400).json({ error: "name, paramKey, and at least 2 variants are required" });
  }

  const [configKey] = await db.select().from(configKeys).where(eq(configKeys.key, paramKey));
  if (!configKey) return res.status(404).json({ error: "Parameter not found" });

  const [result] = await db.insert(experiments).values({ name, configKeyId: configKey.id, status: "draft" });

  for (const v of variants) {
    await db.insert(experimentVariants).values({
      experimentId: result.insertId,
      name: v.name,
      value: v.value,
      splitPercent: v.split,
    });
  }

  await db.insert(auditLog).values({ userId: req.user.id, action: "Created experiment", target: name });
  res.status(201).json({ id: result.insertId, name, paramKey, status: "draft" });
});

router.post("/:id/status", requireAuth, requireRole("editor"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // running | paused | completed
  if (!["draft", "running", "paused", "completed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const [exp] = await db.select().from(experiments).where(eq(experiments.id, id));
  if (!exp) return res.status(404).json({ error: "Experiment not found" });

  await db.update(experiments).set({ status }).where(eq(experiments.id, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: `Experiment set to ${status}`, target: exp.name });
  res.json({ id, status });
});

module.exports = router;