const express = require("express");
const { desc } = require("drizzle-orm");
const { db } = require("../db");
const { auditLog } = require("../db/schema");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100);
  res.json(rows);
});

module.exports = router;