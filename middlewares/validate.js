// Lightweight request validator using JSON schema-like objects
// Usage: validate({ body: { email: { required: true, type: 'string' } } })

function ensure(obj, path, rules, errors, location) {
  for (const [key, rule] of Object.entries(rules || {})) {
    const value = obj?.[key];
    if (
      rule.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${location}.${key} est requis`);
      continue;
    }
    if (value !== undefined && rule.type && typeof value !== rule.type) {
      errors.push(`${location}.${key} doit être de type ${rule.type}`);
    }
    if (value !== undefined && rule.enum && !rule.enum.includes(value)) {
      errors.push(
        `${location}.${key} doit être parmi: ${rule.enum.join(", ")}`
      );
    }
  }
}

function validate(schema = {}) {
  return (req, res, next) => {
    const errors = [];
    ensure(req.body, "body", schema.body, errors, "body");
    ensure(req.query, "query", schema.query, errors, "query");
    ensure(req.params, "params", schema.params, errors, "params");

    if (errors.length) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Données invalides",
          details: errors,
        });
    }
    next();
  };
}

module.exports = validate;
