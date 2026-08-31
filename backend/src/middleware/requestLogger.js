const { eq } = require("drizzle-orm");
const { db } = require("../db");
const { apps, requestLogs } = require("../db/schema");
async function logRequest(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    setImmediate(async () => {
      try {
        const [app] = await db.select({ id: apps.id }).from(apps).where(eq(apps.apiKey, req.apiKey));
        if (!app) return;

        const action = req.path === "/event" ? "event_track" : "config_fetch";
        const { userId, platform, country } = req.method === "GET" ? req.query : (req.body || {});

        await db.insert(requestLogs).values({
          appId: app.id,
          action,
          userId: userId || null,
          platform: platform || null,
          country: country || null,
          statusCode: res.statusCode,
        });
      } catch (err) {
        console.error("requestLogger error:", err.message);
      }
    });

    return originalJson(body);
  };

  next();
}

module.exports = { logRequest };
