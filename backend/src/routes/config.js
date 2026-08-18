const express = require("express");
const crypto = require("crypto");
const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { apps, configKeys, configValues, experiments, experimentVariants, experimentEvents } = require("../db/schema");
const { requireApiKey } = require("../middleware/auth");

const router = express.Router();

function bucketFor(userIdentifier, experimentId) {
  const hash = crypto.createHash("md5").update(`${userIdentifier}:${experimentId}`).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16);
  return num % 100; // 0-99
}

router.get("/", requireApiKey, async (req, res) => {
  const { userId } = req.query;

  const [app] = await db.select().from(apps).where(eq(apps.apiKey, req.apiKey));
  if (!app) return res.status(401).json({ error: "Invalid API key" });

  const keys = await db.select().from(configKeys).where(eq(configKeys.environmentId, app.environmentId));

  const result = {};

  for (const key of keys) {
    const [val] = await db.select().from(configValues).where(eq(configValues.configKeyId, key.id));
    let finalValue = val ? val.publishedValue : null;

    const exps = await db
      .select()
      .from(experiments)
      .where(eq(experiments.configKeyId, key.id));

    const runningExp = exps.find((e) => e.status === "running");

    if (runningExp && userId) {
      const variants = await db
        .select()
        .from(experimentVariants)
        .where(eq(experimentVariants.experimentId, runningExp.id));

      const bucket = bucketFor(userId, runningExp.id);
      let cumulative = 0;
      let assignedVariant = variants[0];

      for (const v of variants) {
        cumulative += v.splitPercent;
        if (bucket < cumulative) {
          assignedVariant = v;
          break;
        }
      }

      finalValue = assignedVariant.value;

      const alreadyAssigned = await db
        .select()
        .from(experimentEvents)
        .where(eq(experimentEvents.userIdentifier, userId));

      const hasAssignment = alreadyAssigned.some(
        (e) => e.experimentId === runningExp.id && e.eventType === "assigned"
      );

      if (!hasAssignment) {
        await db.insert(experimentEvents).values({
          experimentId: runningExp.id,
          variantId: assignedVariant.id,
          userIdentifier: userId,
          eventType: "assigned",
        });
      }
    }

    result[key.key] = finalValue;
  }

  res.json(result);
});

router.post("/event", requireApiKey, async (req, res) => {
  const { userId, experimentId, variantId } = req.body;
  if (!userId || !experimentId || !variantId) {
    return res.status(400).json({ error: "userId, experimentId, variantId required" });
  }

  await db.insert(experimentEvents).values({
    experimentId,
    variantId,
    userIdentifier: userId,
    eventType: "converted",
  });

  res.json({ success: true });
});

module.exports = router;