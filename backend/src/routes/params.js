const express = require("express");
const { eq, and } = require("drizzle-orm");
const { db } = require("../db");
const { configKeys, configValues, environments, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const { environment } = req.query;
  if (!environment) return res.status(400).json({ error: "environment query param is required" });

  const [env] = await db.select().from(environments).where(eq(environments.name, environment));
  if (!env) return res.status(404).json({ error: "Environment not found" });

  const rows = await db
    .select({
      id: configKeys.id,
      key: configKeys.key,
      type: configKeys.type,
      draftValue: configValues.draftValue,
      publishedValue: configValues.publishedValue,
      hasDraftChange: configValues.hasDraftChange,
      updatedAt: configValues.updatedAt,
    })
    .from(configKeys)
    .leftJoin(configValues, eq(configValues.configKeyId, configKeys.id))
    .where(eq(configKeys.environmentId, env.id));

  res.json(rows);
});

router.post("/", requireAuth, requireRole("editor"), async (req, res) => {
  const { key, type, defaultValue, environment } = req.body;
  if (!key || !type || !environment) return res.status(400).json({ error: "key, type, environment required" });

  const [env] = await db.select().from(environments).where(eq(environments.name, environment));
  if (!env) return res.status(404).json({ error: "Environment not found" });

  const existing = await db.select().from(configKeys).where(and(eq(configKeys.key, key), eq(configKeys.environmentId, env.id)));
  if (existing.length > 0) return res.status(409).json({ error: "Parameter already exists in this environment" });

  const [keyResult] = await db.insert(configKeys).values({ key, type, environmentId: env.id });
  await db.insert(configValues).values({
    configKeyId: keyResult.insertId,
    draftValue: defaultValue ?? "",
    publishedValue: null,
    hasDraftChange: true,
  });
  await db.insert(auditLog).values({ userId: req.user.id, action: "Created parameter", target: key });

  res.status(201).json({ id: keyResult.insertId, key, type, defaultValue });
});

router.put("/:id", requireAuth, requireRole("editor"), async (req, res) => {
  const { id } = req.params;
  const { defaultValue } = req.body;

  const [configKey] = await db.select().from(configKeys).where(eq(configKeys.id, id));
  if (!configKey) return res.status(404).json({ error: "Parameter not found" });

  await db.update(configValues).set({ draftValue: defaultValue, hasDraftChange: true }).where(eq(configValues.configKeyId, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: "Updated parameter", target: configKey.key });

  res.json({ id, defaultValue });
});

router.delete("/:id", requireAuth, requireRole("editor"), async (req, res) => {
  const { id } = req.params;

  const [configKey] = await db.select().from(configKeys).where(eq(configKeys.id, id));
  if (!configKey) return res.status(404).json({ error: "Parameter not found" });

  await db.delete(configValues).where(eq(configValues.configKeyId, id));
  await db.delete(configKeys).where(eq(configKeys.id, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: "Deleted parameter", target: configKey.key });

  res.json({ success: true });
});

module.exports = router;