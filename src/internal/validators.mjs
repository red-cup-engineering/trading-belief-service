/**
 * Small field validators shared across this package's belief-record,
 * belief-edge, and evidence-fusion modules. Each module keeps its own
 * refusal-message prefix (the label it has always thrown under), so this
 * factory takes that prefix once and returns validators that throw exactly
 * the messages each call site already threw -- not a new shared message
 * format. Internal only: not part of this package's public exports.
 */
export function createFieldValidators(modulePrefix) {
  function requireNonEmptyString(value, label) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new TypeError(`${modulePrefix}: ${label} must be a non-empty string, got ${JSON.stringify(value)}`);
    }
    return value;
  }

  function requireFiniteNumber(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError(`${modulePrefix}: ${label} must be a finite number, got ${JSON.stringify(value)}`);
    }
    return value;
  }

  return Object.freeze({ requireNonEmptyString, requireFiniteNumber });
}
