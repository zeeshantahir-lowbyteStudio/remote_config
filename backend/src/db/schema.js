const { mysqlTable, int, varchar, text, boolean, timestamp, mysqlEnum, uniqueIndex } = require("drizzle-orm/mysql-core");

const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  googleId: varchar("google_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["viewer", "editor", "publisher", "admin"]).notNull().default("viewer"),
  createdAt: timestamp("created_at").defaultNow(),
});

const environments = mysqlTable("environments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

const apps = mysqlTable("apps", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  apiKey: varchar("api_key", { length: 100 }).notNull().unique(),
  environmentId: int("environment_id").notNull().references(() => environments.id),
});

const configKeys = mysqlTable("config_keys", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["String", "Boolean", "Number", "JSON"]).notNull(),
  environmentId: int("environment_id").notNull().references(() => environments.id),
});

const configValues = mysqlTable("config_values", {
  id: int("id").autoincrement().primaryKey(),
  configKeyId: int("config_key_id").notNull().references(() => configKeys.id),
  draftValue: text("draft_value"),
  publishedValue: text("published_value"),
  hasDraftChange: boolean("has_draft_change").default(false),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

const conditions = mysqlTable("conditions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ruleExpression: varchar("rule_expression", { length: 500 }).notNull(),
  environmentId: int("environment_id").notNull().references(() => environments.id),
});

const configKeyConditions = mysqlTable("config_key_conditions", {
  id: int("id").autoincrement().primaryKey(),
  configKeyId: int("config_key_id").notNull().references(() => configKeys.id),
  conditionId: int("condition_id").notNull().references(() => conditions.id),
  overrideValue: text("override_value").notNull(),
  priority: int("priority").notNull().default(0),
});

const experiments = mysqlTable("experiments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  configKeyId: int("config_key_id").notNull().references(() => configKeys.id),
  status: mysqlEnum("status", ["draft", "running", "paused", "completed"]).notNull().default("draft"),
});

const experimentVariants = mysqlTable("experiment_variants", {
  id: int("id").autoincrement().primaryKey(),
  experimentId: int("experiment_id").notNull().references(() => experiments.id),
  name: varchar("name", { length: 100 }).notNull(),
  value: text("value").notNull(),
  splitPercent: int("split_percent").notNull(),
});

const experimentEvents = mysqlTable("experiment_events", {
  id: int("id").autoincrement().primaryKey(),
  experimentId: int("experiment_id").notNull().references(() => experiments.id),
  variantId: int("variant_id").notNull().references(() => experimentVariants.id),
  userIdentifier: varchar("user_identifier", { length: 255 }).notNull(),
  eventType: mysqlEnum("event_type", ["assigned", "converted"]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

const publishHistory = mysqlTable("publish_history", {
  id: int("id").autoincrement().primaryKey(),
  environmentId: int("environment_id").notNull().references(() => environments.id),
  version: int("version").notNull(),
  publishedBy: int("published_by").notNull().references(() => users.id),
  summary: varchar("summary", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  target: varchar("target", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

module.exports = {
  users, environments, apps, configKeys, configValues, conditions,
  configKeyConditions, experiments, experimentVariants, experimentEvents,
  publishHistory, auditLog,
};