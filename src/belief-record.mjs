/**
 * The belief record type from PERSONAL-QUANT-PLATFORM-THEORY.md: a
 * principal's revisable view of the world, kept distinct from
 * observation/forecast/valuation/policy/order-intent records. Every
 * belief must carry a stated falsifier; a record missing one is refused.
 */

import { createFieldValidators } from "./internal/validators.mjs";

const REQUIRED_HORIZON_UNITS = Object.freeze(["days", "months", "years"]);
const REQUIRED_DIRECTIONS = Object.freeze(["increase", "decrease"]);

/** @typedef {{kind: string, identifier: string}} AffectedEntity A company, sector, factor, commodity, rate, or other entity a belief's consequence touches. */
/** @typedef {{amount: number, unit: "days"|"months"|"years"}} BeliefHorizon The window over which the belief's consequence should appear. */
/** @typedef {{at: string, confidence?: number, falsifier?: string, note?: string}} BeliefRevision One dated revision to a belief's confidence, falsifier, or rationale. */
/** @typedef {{proposition: string, affectedEntities: AffectedEntity[], direction: "increase"|"decrease", magnitude: number, horizon: BeliefHorizon, confidence: number, falsifier: string, supportingObservations?: string[], contraryObservations?: string[], dependsOnBeliefIds?: string[], heldDate: string, revisions?: BeliefRevision[], id?: string}} BeliefRecordFields The full belief record shape PERSONAL-QUANT-PLATFORM-THEORY.md requires; `falsifier` -- what would change this belief -- is required, never optional. */

const { requireNonEmptyString, requireFiniteNumber } = createFieldValidators("belief-record");

function requireUnitInterval(value, label) {
  requireFiniteNumber(value, label);
  if (value < 0 || value > 1) {
    throw new TypeError(`belief-record: ${label} must be in [0,1], got ${value}`);
  }
  return value;
}

function requireIsoDate(value, label) {
  requireNonEmptyString(value, label);
  if (Number.isNaN(Date.parse(value))) {
    throw new TypeError(`belief-record: ${label} must be a parseable ISO 8601 date, got ${JSON.stringify(value)}`);
  }
  return value;
}

function validateAffectedEntity(entity, index) {
  if (typeof entity !== "object" || entity === null) {
    throw new TypeError(`belief-record: affectedEntities[${index}] must be an object`);
  }
  requireNonEmptyString(entity.kind, `affectedEntities[${index}].kind`);
  requireNonEmptyString(entity.identifier, `affectedEntities[${index}].identifier`);
  return entity;
}

function validateHorizon(horizon) {
  if (typeof horizon !== "object" || horizon === null) {
    throw new TypeError("belief-record: horizon must be an object of {amount, unit}");
  }
  requireFiniteNumber(horizon.amount, "horizon.amount");
  if (horizon.amount <= 0) {
    throw new TypeError(`belief-record: horizon.amount must be > 0, got ${horizon.amount}`);
  }
  if (!REQUIRED_HORIZON_UNITS.includes(horizon.unit)) {
    throw new TypeError(`belief-record: horizon.unit must be one of ${REQUIRED_HORIZON_UNITS.join(", ")}, got ${JSON.stringify(horizon.unit)}`);
  }
  return horizon;
}

function validateStringArray(value, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim().length > 0)) {
    throw new TypeError(`belief-record: ${label} must be an array of non-empty strings when present`);
  }
  return value;
}

function validateRevision(revision, index) {
  if (typeof revision !== "object" || revision === null) {
    throw new TypeError(`belief-record: revisions[${index}] must be an object`);
  }
  requireIsoDate(revision.at, `revisions[${index}].at`);
  if (revision.confidence !== undefined) requireUnitInterval(revision.confidence, `revisions[${index}].confidence`);
  if (revision.falsifier !== undefined) requireNonEmptyString(revision.falsifier, `revisions[${index}].falsifier`);
  return revision;
}

/**
 * Validates a belief record's fields against the shape
 * PERSONAL-QUANT-PLATFORM-THEORY.md requires. Refuses (throws) a record
 * with no falsifier -- the explicit anti-vibe discipline: a belief that
 * cannot say what would change it is not data, and is never accepted as
 * merely incomplete.
 * @param {BeliefRecordFields} fields
 * @returns {BeliefRecordFields} the same fields, unmodified, once validated.
 * @throws {TypeError} when any required field is missing or malformed, or when `falsifier` is absent.
 */
export function validateBeliefRecord(fields) {
  if (typeof fields !== "object" || fields === null) {
    throw new TypeError("belief-record: fields must be an object");
  }
  requireNonEmptyString(fields.proposition, "proposition");
  if (!Array.isArray(fields.affectedEntities) || fields.affectedEntities.length === 0) {
    throw new TypeError("belief-record: affectedEntities must be a non-empty array");
  }
  fields.affectedEntities.forEach(validateAffectedEntity);
  if (!REQUIRED_DIRECTIONS.includes(fields.direction)) {
    throw new TypeError(`belief-record: direction must be one of ${REQUIRED_DIRECTIONS.join(", ")}, got ${JSON.stringify(fields.direction)}`);
  }
  requireFiniteNumber(fields.magnitude, "magnitude");
  if (fields.magnitude < 0) {
    throw new TypeError(`belief-record: magnitude must be >= 0, got ${fields.magnitude}`);
  }
  validateHorizon(fields.horizon);
  requireUnitInterval(fields.confidence, "confidence");
  // the falsifier is the anti-vibe discipline this record type exists to enforce -- absence is a refusal, not a default
  requireNonEmptyString(fields.falsifier, "falsifier");
  validateStringArray(fields.supportingObservations, "supportingObservations");
  validateStringArray(fields.contraryObservations, "contraryObservations");
  validateStringArray(fields.dependsOnBeliefIds, "dependsOnBeliefIds");
  requireIsoDate(fields.heldDate, "heldDate");
  if (fields.revisions !== undefined) {
    if (!Array.isArray(fields.revisions)) throw new TypeError("belief-record: revisions must be an array when present");
    fields.revisions.forEach(validateRevision);
  }
  if (fields.id !== undefined) requireNonEmptyString(fields.id, "id");
  return fields;
}

/**
 * Constructs a frozen, validated belief record. Defaults `revisions` to an
 * empty array and `supportingObservations`/`contraryObservations`/
 * `dependsOnBeliefIds` to empty arrays when absent.
 * @param {BeliefRecordFields} fields
 * @returns {Readonly<BeliefRecordFields>} the frozen belief record.
 * @throws {TypeError} when `validateBeliefRecord` refuses the fields (including a missing falsifier).
 */
export function createBeliefRecord(fields) {
  validateBeliefRecord(fields);
  const record = {
    ...(fields.id !== undefined ? { id: fields.id } : {}),
    proposition: fields.proposition,
    affectedEntities: fields.affectedEntities.map((entity) => Object.freeze({ ...entity })),
    direction: fields.direction,
    magnitude: fields.magnitude,
    horizon: Object.freeze({ ...fields.horizon }),
    confidence: fields.confidence,
    falsifier: fields.falsifier,
    supportingObservations: [...(fields.supportingObservations ?? [])],
    contraryObservations: [...(fields.contraryObservations ?? [])],
    dependsOnBeliefIds: [...(fields.dependsOnBeliefIds ?? [])],
    heldDate: fields.heldDate,
    revisions: (fields.revisions ?? []).map((revision) => Object.freeze({ ...revision })),
  };
  return Object.freeze(record);
}

/**
 * Returns a new belief record with one revision appended to its history.
 * Never mutates `record`; belief records are immutable once constructed.
 * @param {Readonly<BeliefRecordFields>} record An existing, validated belief record.
 * @param {BeliefRevision} revision The revision to append; `falsifier`, when given, must be a non-empty string.
 * @returns {Readonly<BeliefRecordFields>} a new frozen belief record with the revision appended.
 * @throws {TypeError} when `revision` is malformed.
 */
export function reviseBeliefRecord(record, revision) {
  validateRevision(revision, record.revisions.length);
  return createBeliefRecord({
    ...record,
    confidence: revision.confidence ?? record.confidence,
    falsifier: revision.falsifier ?? record.falsifier,
    revisions: [...record.revisions, revision],
  });
}
