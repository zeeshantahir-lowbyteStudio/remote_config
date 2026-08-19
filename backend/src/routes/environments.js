const express = require("express");
const { eq, and } = require("drizzle-orm");
const { db } = require("../db");
const { environments, projects, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const { project } = req.query;
  if (!project) return res.status(400).json({ error: "project query param is required" });

  const [proj] = await db.select().from(projects).where(eq(projects.name, project));
  if (!proj) return res.status(404).json({ error: "Project not found" });

  const rows = await db.select().from(environments).where(eq(environments.projectId, proj.id));
  res.json(rows);
});

router.post("/", requireAuth, requireRole("publisher"), async (req, res) => {
  const { name, project } = req.body;
  if (!name || !project) return res.status(400).json({ error: "name and project are required" });

  const [proj] = await db.select().from(projects).where(eq(projects.name, project));
  if (!proj) return res.status(404).json({ error: "Project not found" });

  const existing = await db
    .select()
    .from(environments)
    .where(and(eq(environments.name, name), eq(environments.projectId, proj.id)));
  if (existing.length > 0) return res.status(409).json({ error: "Environment already exists in this project" });

  const [result] = await db.insert(environments).values({ name, projectId: proj.id });
  await db.insert(auditLog).values({ userId: req.user.id, action: "Created environment", target: `${project}/${name}` });
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