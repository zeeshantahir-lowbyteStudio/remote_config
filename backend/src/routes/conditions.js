const express = require("express");
const { eq, and } = require("drizzle-orm");
const { db } = require("../db");
const { conditions, environments, projects, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

async function resolveEnvironment(projectName, environmentName) {
  const [proj] = await db.select().from(projects).where(eq(projects.name, projectName));
  if (!proj) return null;

  const [env] = await db
    .select()
    .from(environments)
    .where(and(eq(environments.name, environmentName), eq(environments.projectId, proj.id)));
  return env || null;
}

router.get("/", requireAuth, async (req, res) => {
  const { project, environment } = req.query;
  if (!project || !environment) {
    return res.status(400).json({ error: "project and environment query params are required" });
  }

  const env = await resolveEnvironment(project, environment);
  if (!env) return res.status(404).json({ error: "Environment not found for this project" });

  const rows = await db.select().from(conditions).where(eq(conditions.environmentId, env.id));
  res.json(rows);
});

router.post("/", requireAuth, requireRole("editor"), async (req, res) => {
  const { name, rules, project, environment } = req.body;
  if (!name || !rules || !project || !environment) {
    return res.status(400).json({ error: "name, rules, project, environment required" });
  }

  const env = await resolveEnvironment(project, environment);
  if (!env) return res.status(404).json({ error: "Environment not found for this project" });

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

  // Delete all param links first to avoid foreign key constraint error
  const { configKeyConditions } = require("../db/schema");
  await db.delete(configKeyConditions).where(eq(configKeyConditions.conditionId, Number(id)));

  await db.delete(conditions).where(eq(conditions.id, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: "Deleted condition", target: condition.name });
  res.json({ success: true });
});

module.exports = router;