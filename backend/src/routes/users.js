const express = require("express");
const { eq } = require("drizzle-orm");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { db } = require("../db");
const { users, auditLog } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendInviteEmail } = require("../lib/mailer");

const router = express.Router();

const VALID_ROLES = ["viewer", "editor", "publisher", "admin"];
function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const seg = () => Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join("");
  return `${seg()}-${seg()}-${seg()}`;
}

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const rows = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, createdAt: users.createdAt })
    .from(users);
  res.json(rows);
});
router.post("/invite", requireAuth, requireRole("admin"), async (req, res) => {
  const { email, name, role } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });
  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` });
  }
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return res.status(409).json({ error: "A user with this email already exists" });

  const plainPassword = generatePassword();
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const [result] = await db.insert(users).values({
    email,
    name: name || null,
    passwordHash,
    invitedBy: req.user.id,
    role: role || "viewer",
  });
  try {
    const inviter = await db.select().from(users).where(eq(users.id, req.user.id));
    const inviterName = inviter[0]?.name || inviter[0]?.email || "An admin";
    await sendInviteEmail({ to: email, inviteeName: name || "", inviterName, password: plainPassword });
  } catch (mailErr) {
    console.error("Failed to send invite email:", mailErr.message);
    return res.status(201).json({
      id: result.insertId,
      email,
      name: name || null,
      role: role || "viewer",
      warning: "User created but invite email could not be sent. Check SMTP settings.",
    });
  }

  await db.insert(auditLog).values({
    userId: req.user.id,
    action: "Invited user",
    target: email,
  });

  res.status(201).json({ id: result.insertId, email, name: name || null, role: role || "viewer" });
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