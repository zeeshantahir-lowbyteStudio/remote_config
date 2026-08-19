// Evaluates simple rule expressions like: "platform == ios", "app == mobile_app", "country != PK"
// context = { platform, country, app, userId, ...whatever the request provides }
function evaluateRule(ruleExpression, context) {
  const match = ruleExpression.trim().match(/^(\w+)\s*(==|!=)\s*(.+)$/);
  if (!match) return false;

  const [, field, operator, rawValue] = match;
  const expectedValue = rawValue.trim().replace(/^["']|["']$/g, "");
  const actualValue = context[field];

  if (actualValue === undefined || actualValue === null) return false;

  if (operator === "==") return String(actualValue) === expectedValue;
  if (operator === "!=") return String(actualValue) !== expectedValue;
  return false;
}

module.exports = { evaluateRule };