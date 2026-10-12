import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calibratedConfidence,
  computeBeliefEdge,
  expectedForecastPremium,
  horizonCompatibility,
  transitionCost,
  uncertaintyPenalty,
} from "../src/belief-edge.mjs";

test("expectedForecastPremium computes a single-point ratio", () => {
  assert.ok(Math.abs(expectedForecastPremium(110, 100) - 0.1) < 1e-9);
});

test("expectedForecastPremium averages scenario samples before the ratio", () => {
  assert.ok(Math.abs(expectedForecastPremium([100, 120], 100) - 0.1) < 1e-9);
});

test("expectedForecastPremium refuses a non-positive market price", () => {
  assert.throws(() => expectedForecastPremium(110, 0), TypeError);
  assert.throws(() => expectedForecastPremium(110, -5), TypeError);
});

test("calibratedConfidence passes raw confidence through by default and clamps to 1", () => {
  assert.equal(calibratedConfidence(0.8), 0.8);
  assert.equal(calibratedConfidence(0.8, 1.5), 1);
});

test("calibratedConfidence refuses confidence outside [0,1]", () => {
  assert.throws(() => calibratedConfidence(1.2), TypeError);
  assert.throws(() => calibratedConfidence(-0.1), TypeError);
});

test("horizonCompatibility is 1 for identical horizons and falls as they diverge", () => {
  assert.equal(horizonCompatibility(365, 365), 1);
  assert.ok(Math.abs(horizonCompatibility(180, 365) - (1 - 185 / 365)) < 1e-12);
});

test("horizonCompatibility refuses non-positive horizons", () => {
  assert.throws(() => horizonCompatibility(0, 365), TypeError);
  assert.throws(() => horizonCompatibility(365, -1), TypeError);
});

test("uncertaintyPenalty scales spread by weight and refuses negatives", () => {
  assert.equal(uncertaintyPenalty(0.05, 2), 0.1);
  assert.equal(uncertaintyPenalty(0.05), 0.05);
  assert.throws(() => uncertaintyPenalty(-0.01), TypeError);
});

test("transitionCost passes a non-negative fraction through and refuses negatives", () => {
  assert.equal(transitionCost(0.02), 0.02);
  assert.throws(() => transitionCost(-0.01), TypeError);
});

test("computeBeliefEdge composes the five named terms without folding them together", () => {
  const result = computeBeliefEdge({
    forecastValue: 110,
    marketPrice: 100,
    rawConfidence: 0.8,
    beliefHorizon: 365,
    forecastHorizon: 365,
    forecastSpread: 0.05,
    transitionCostFraction: 0.02,
  });
  assert.ok(Math.abs(result.expectedForecastPremium - 0.1) < 1e-9);
  assert.equal(result.calibratedConfidence, 0.8);
  assert.equal(result.horizonCompatibility, 1);
  assert.equal(result.uncertaintyPenalty, 0.05);
  assert.equal(result.transitionCost, 0.02);
  // 0.1 * 0.8 * 1 - 0.05 - 0.02 = 0.01
  assert.ok(Math.abs(result.beliefEdge - 0.01) < 1e-9);
});

test("computeBeliefEdge lets a high uncertainty penalty and transition cost erase a positive premium", () => {
  const result = computeBeliefEdge({
    forecastValue: 105,
    marketPrice: 100,
    rawConfidence: 0.9,
    beliefHorizon: 90,
    forecastHorizon: 90,
    forecastSpread: 0.2,
    transitionCostFraction: 0.03,
  });
  // 0.05 * 0.9 * 1 - 0.2 - 0.03 = 0.045 - 0.23 = -0.185
  assert.ok(result.beliefEdge < 0);
  assert.ok(Math.abs(result.beliefEdge - (-0.185)) < 1e-9);
});
