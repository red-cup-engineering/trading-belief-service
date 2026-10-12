import assert from "node:assert/strict";
import { test } from "node:test";
import { createBeliefRecord, reviseBeliefRecord, validateBeliefRecord } from "../src/belief-record.mjs";

const BASE_FIELDS = Object.freeze({
  proposition: "I want a permanent claim on the growth of asset management, expressed through BLK.",
  affectedEntities: [{ kind: "company", identifier: "BLK" }],
  direction: "increase",
  magnitude: 0.5,
  horizon: { amount: 10, unit: "years" },
  confidence: 0.7,
  falsifier: "if BlackRock's AUM growth structurally decouples from asset-management industry growth for two consecutive years",
  heldDate: "2026-08-31",
});

test("createBeliefRecord refuses a belief record with no falsifier", () => {
  const { falsifier, ...withoutFalsifier } = BASE_FIELDS;
  assert.throws(() => createBeliefRecord(withoutFalsifier), TypeError);
});

test("createBeliefRecord refuses a belief record with a blank falsifier", () => {
  assert.throws(() => createBeliefRecord({ ...BASE_FIELDS, falsifier: "   " }), TypeError);
});

test("validateBeliefRecord refuses missing proposition, affectedEntities, and heldDate", () => {
  const { proposition, ...withoutProposition } = BASE_FIELDS;
  assert.throws(() => validateBeliefRecord(withoutProposition), TypeError);
  assert.throws(() => validateBeliefRecord({ ...BASE_FIELDS, affectedEntities: [] }), TypeError);
  assert.throws(() => validateBeliefRecord({ ...BASE_FIELDS, heldDate: "not-a-date" }), TypeError);
});

test("createBeliefRecord accepts a complete belief and freezes it", () => {
  const record = createBeliefRecord(BASE_FIELDS);
  assert.equal(record.proposition, BASE_FIELDS.proposition);
  assert.equal(record.falsifier, BASE_FIELDS.falsifier);
  assert.deepEqual(record.supportingObservations, []);
  assert.deepEqual(record.revisions, []);
  assert.ok(Object.isFrozen(record));
  assert.throws(() => {
    record.confidence = 0.9;
  }, TypeError);
});

test("reviseBeliefRecord appends a revision without mutating the original", () => {
  const original = createBeliefRecord(BASE_FIELDS);
  const revised = reviseBeliefRecord(original, { at: "2026-09-15", confidence: 0.6, note: "AUM growth slowed one quarter" });
  assert.equal(original.revisions.length, 0);
  assert.equal(revised.revisions.length, 1);
  assert.equal(revised.confidence, 0.6);
  assert.equal(revised.falsifier, BASE_FIELDS.falsifier);
});

test("reviseBeliefRecord refuses a revision with a malformed date", () => {
  const original = createBeliefRecord(BASE_FIELDS);
  assert.throws(() => reviseBeliefRecord(original, { at: "not-a-date" }), TypeError);
});
