const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { projects, environments, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const rows = await db.select().from(projects);
  res.json(rows);
});

router.post("/", requireAuth, requireRole("publisher"), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const existing = await db.select().from(projects).where(eq(projects.name, name));
  if (existing.length > 0) return res.status(409).json({ error: "Project already exists" });

  const [result] = await db.insert(projects).values({ name });

  // Auto-create dev/staging/prod for the new project, matching Firebase's default setup
  await db.insert(environments).values([
    { name: "dev", projectId: result.insertId },
    { name: "staging", projectId: result.insertId },
    { name: "prod", projectId: result.insertId },
  ]);

  await db.insert(auditLog).values({ userId: req.user.id, action: "Created project", target: name });
  res.status(201).json({ id: result.insertId, name });
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return res.status(404).json({ error: "Project not found" });

  await db.delete(projects).where(eq(projects.id, id));
  await db.insert(auditLog).values({ userId: req.user.id, action: "Deleted project", target: project.name });
  res.json({ success: true });
});

module.exports = router;