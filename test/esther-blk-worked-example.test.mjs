import assert from "node:assert/strict";
import test from "node:test";
import { computeBeliefEdge } from "../src/belief-edge.mjs";
import { createBeliefRecord } from "../src/belief-record.mjs";
import { fuseBeliefWithEvidence } from "../src/evidence-fusion.mjs";

/**
 * The "stack BLK" standing-accumulation belief from
 * PERSONAL-QUANT-PLATFORM-THEORY.md's third belief-record example and
 * "Esther as a worked instance" section: a permanent claim on the growth
 * of asset management, expressed through NYSE-listed BlackRock (BLK).
 */
function estherBlkBelief() {
  return createBeliefRecord({
    id: "belief:esther:blk-permanent-claim",
    proposition: "I want a permanent claim on the growth of asset management, expressed through BLK.",
    affectedEntities: [{ kind: "company", identifier: "BLK" }],
    direction: "increase",
    magnitude: 0.6,
    horizon: { amount: 10, unit: "years" },
    confidence: 0.75,
    falsifier: "if BlackRock's AUM growth structurally decouples from asset-management industry growth for two consecutive years",
    supportingObservations: ["BLK AUM grew faster than the broader asset-management industry over the trailing five years"],
    contraryObservations: [],
    heldDate: "2026-08-31",
  });
}

test("Esther's BLK belief is a valid, falsifier-bearing record", () => {
  const belief = estherBlkBelief();
  assert.equal(belief.affectedEntities[0].identifier, "BLK");
  assert.match(belief.falsifier, /AUM growth/u);
});

test("belief -> evidence fusion -> belief edge: agreeing evidence yields a positive, sleeve-worthy edge", () => {
  const belief = estherBlkBelief();
  const fusion = fuseBeliefWithEvidence([
    { stance: "supports", description: belief.supportingObservations[0], weight: 3 },
    { stance: "supports", description: "active-to-passive rotation continues to favor scale managers", weight: 1 },
  ]);
  assert.equal(fusion.conflicted, false);
  assert.equal(fusion.supportFraction, 1);

  const beliefHorizonDays = belief.horizon.amount * 365;
  const edge = computeBeliefEdge({
    forecastValue: 1100,
    marketPrice: 1000,
    rawConfidence: belief.confidence,
    calibrationMultiplier: fusion.supportFraction,
    beliefHorizon: beliefHorizonDays,
    forecastHorizon: beliefHorizonDays,
    forecastSpread: 0.05,
    transitionCostFraction: 0.01,
  });

  // 0.1 * 0.75 * 1 - 0.05 - 0.01 = 0.015
  assert.ok(Math.abs(edge.beliefEdge - 0.015) < 1e-9);
  assert.ok(edge.beliefEdge > 0, "a positive belief edge is the sleeve-worthy signal: discount survives confidence, horizon, uncertainty, and cost");
});

test("belief -> evidence fusion -> belief edge: contrary evidence lowers calibrated confidence and shrinks the edge", () => {
  const belief = estherBlkBelief();
  const fusion = fuseBeliefWithEvidence([
    { stance: "supports", description: belief.supportingObservations[0], weight: 2 },
    { stance: "contradicts", description: "a fee-compression cycle across the asset-management industry accelerated", weight: 2 },
  ]);
  assert.equal(fusion.conflicted, true);
  assert.equal(fusion.supportFraction, 0.5);

  const beliefHorizonDays = belief.horizon.amount * 365;
  const edge = computeBeliefEdge({
    forecastValue: 1100,
    marketPrice: 1000,
    rawConfidence: belief.confidence,
    calibrationMultiplier: fusion.supportFraction,
    beliefHorizon: beliefHorizonDays,
    forecastHorizon: beliefHorizonDays,
    forecastSpread: 0.05,
    transitionCostFraction: 0.01,
  });

  // 0.1 * 0.375 * 1 - 0.05 - 0.01 = -0.0225
  assert.ok(edge.calibratedConfidence < belief.confidence);
  assert.ok(Math.abs(edge.beliefEdge - (-0.0225)) < 1e-9);
  assert.ok(edge.beliefEdge < 0, "conflicted evidence should be able to erase sleeve-worthiness, not be silently averaged away");
});
