const express = require("express");
const { eq, desc } = require("drizzle-orm");
const { db } = require("../db");
const { publishHistory, environments, configKeys, configValues, users } = require("../db/schema");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const rows = await db.select().from(publishHistory).orderBy(desc(publishHistory.version));
  res.json(rows);
});

// Publish: copy all draft values to published, for a given environment
router.post("/publish", requireAuth, requireRole("publisher"), async (req, res) => {
  const { environment, summary } = req.body;
  if (!environment) return res.status(400).json({ error: "environment is required" });

  const [env] = await db.select().from(environments).where(eq(environments.name, environment));
  if (!env) return res.status(404).json({ error: "Environment not found" });

  const keys = await db.select().from(configKeys).where(eq(configKeys.environmentId, env.id));

  for (const key of keys) {
  const [val] = await db.select().from(configValues).where(eq(configValues.configKeyId, key.id));
  if (val) {
    await db.update(configValues)
      .set({ publishedValue: val.draftValue, hasDraftChange: false })
      .where(eq(configValues.configKeyId, key.id));
  }
}

  const [lastVersion] = await db
    .select()
    .from(publishHistory)
    .where(eq(publishHistory.environmentId, env.id))
    .orderBy(desc(publishHistory.version))
    .limit(1);

  const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

  await db.insert(publishHistory).values({
    environmentId: env.id,
    version: nextVersion,
    publishedBy: req.user.id,
    summary: summary || "Published changes",
  });

  res.json({ version: nextVersion });
});

module.exports = router;