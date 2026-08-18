const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { users, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const VALID_ROLES = ["viewer", "editor", "publisher", "admin"];

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
    .from(users);
  res.json(rows);
});

router.put("/:id/role", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` });
  }

  const [targetUser] = await db.select().from(users).where(eq(users.id, id));
  if (!targetUser) return res.status(404).json({ error: "User not found" });

  await db.update(users).set({ role }).where(eq(users.id, id));

  await db.insert(auditLog).values({
    userId: req.user.id,
    action: `Changed role to ${role}`,
    target: targetUser.email,
  });

  res.json({ id, email: targetUser.email, role });
});

module.exports = router;