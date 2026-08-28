const express = require("express");
const { eq, and } = require("drizzle-orm");
const { db } = require("../db");
const { configKeys, configKeyConditions, conditions, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.get("/:id/conditions", requireAuth, async (req, res) => {
  const { id } = req.params;

  const [configKey] = await db.select().from(configKeys).where(eq(configKeys.id, id));
  if (!configKey) return res.status(404).json({ error: "Parameter not found" });

  const rows = await db
    .select({
      id: configKeyConditions.id,
      conditionId: configKeyConditions.conditionId,
      conditionName: conditions.name,
      ruleExpression: conditions.ruleExpression,
      overrideValue: configKeyConditions.overrideValue,
      priority: configKeyConditions.priority,
    })
    .from(configKeyConditions)
    .innerJoin(conditions, eq(configKeyConditions.conditionId, conditions.id))
    .where(eq(configKeyConditions.configKeyId, id))
    .orderBy(configKeyConditions.priority);

  res.json(rows);
});

router.post("/:id/conditions", requireAuth, requireRole("editor"), async (req, res) => {
  const { id } = req.params;
  const { conditionId, overrideValue, priority } = req.body;

  if (!conditionId || overrideValue === undefined || overrideValue === null) {
    return res.status(400).json({ error: "conditionId and overrideValue are required" });
  }

  const [configKey] = await db.select().from(configKeys).where(eq(configKeys.id, id));
  if (!configKey) return res.status(404).json({ error: "Parameter not found" });

  const [condition] = await db.select().from(conditions).where(eq(conditions.id, conditionId));
  if (!condition) return res.status(404).json({ error: "Condition not found" });
  const [existing] = await db
    .select()
    .from(configKeyConditions)
    .where(and(eq(configKeyConditions.configKeyId, id), eq(configKeyConditions.conditionId, conditionId)));

  if (existing) {
    return res.status(409).json({ error: "This condition is already attached to this parameter" });
  }

  const [result] = await db.insert(configKeyConditions).values({
    configKeyId: Number(id),
    conditionId: Number(conditionId),
    overrideValue: String(overrideValue),
    priority: priority ?? 0,
  });

  await db.insert(auditLog).values({
    userId: req.user.id,
    action: "Attached condition to parameter",
    target: `${configKey.key} → ${condition.name}`,
  });

  res.status(201).json({
    id: result.insertId,
    conditionId: Number(conditionId),
    conditionName: condition.name,
    ruleExpression: condition.ruleExpression,
    overrideValue: String(overrideValue),
    priority: priority ?? 0,
  });
});


router.put("/:id/conditions/:linkId", requireAuth, requireRole("editor"), async (req, res) => {
  const { id, linkId } = req.params;
  const { overrideValue, priority } = req.body;

  const [link] = await db
    .select()
    .from(configKeyConditions)
    .where(and(eq(configKeyConditions.id, linkId), eq(configKeyConditions.configKeyId, id)));

  if (!link) return res.status(404).json({ error: "Condition link not found" });

  const updates = {};
  if (overrideValue !== undefined) updates.overrideValue = String(overrideValue);
  if (priority !== undefined) updates.priority = Number(priority);

  await db.update(configKeyConditions).set(updates).where(eq(configKeyConditions.id, linkId));

  res.json({ id: Number(linkId), ...updates });
});

router.delete("/:id/conditions/:linkId", requireAuth, requireRole("editor"), async (req, res) => {
  const { id, linkId } = req.params;

  const [link] = await db
    .select({
      id: configKeyConditions.id,
      configKeyId: configKeyConditions.configKeyId,
      conditionName: conditions.name,
      configKeyKey: configKeys.key,
    })
    .from(configKeyConditions)
    .innerJoin(conditions, eq(configKeyConditions.conditionId, conditions.id))
    .innerJoin(configKeys, eq(configKeyConditions.configKeyId, configKeys.id))
    .where(and(eq(configKeyConditions.id, linkId), eq(configKeyConditions.configKeyId, id)));

  if (!link) return res.status(404).json({ error: "Condition link not found" });

  await db.delete(configKeyConditions).where(eq(configKeyConditions.id, linkId));

  await db.insert(auditLog).values({
    userId: req.user.id,
    action: "Detached condition from parameter",
    target: `${link.configKeyKey} → ${link.conditionName}`,
  });

  res.json({ success: true });
});

module.exports = router;
