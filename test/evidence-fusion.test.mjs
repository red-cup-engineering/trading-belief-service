import assert from "node:assert/strict";
import test from "node:test";
import { isTop } from "@lenticule-science/metrologic/bilattice";
import { chargeFromBeliefObservation, fuseBeliefWithEvidence } from "../src/evidence-fusion.mjs";

test("chargeFromBeliefObservation reads a supporting observation as the positive-only FOUR value", () => {
  const charge = chargeFromBeliefObservation({ stance: "supports", description: "AUM grew 12% YoY" });
  assert.deepEqual(charge.value, [true, false]);
  assert.equal(charge.evidence[0].length, 1);
  assert.equal(charge.evidence[1].length, 0);
  assert.equal(charge.evidence[0][0].description, "AUM grew 12% YoY");
});

test("chargeFromBeliefObservation reads a contradicting observation as the negative-only FOUR value", () => {
  const charge = chargeFromBeliefObservation({ stance: "contradicts", description: "a competitor undercut fee structure" });
  assert.deepEqual(charge.value, [false, true]);
  assert.equal(charge.evidence[0].length, 0);
  assert.equal(charge.evidence[1].length, 1);
});

test("chargeFromBeliefObservation rejects an invalid stance", () => {
  assert.throws(() => chargeFromBeliefObservation({ stance: "neutral", description: "x" }), /stance/u);
});

test("fuseBeliefWithEvidence rejects an empty observations array", () => {
  assert.throws(() => fuseBeliefWithEvidence([]), /non-empty array/u);
});

test("fuseBeliefWithEvidence on all-supporting observations: no conflict, full support fraction", () => {
  const observations = [
    { stance: "supports", description: "AUM grew 12% YoY", weight: 2 },
    { stance: "supports", description: "active-to-passive rotation favors scale managers", weight: 1 },
  ];
  const fusion = fuseBeliefWithEvidence(observations);
  assert.equal(fusion.supportFraction, 1);
  assert.deepEqual(fusion.charge.value, [true, false]);
  assert.equal(fusion.conflicted, false);
  assert.equal(isTop(fusion.charge), false);
  assert.equal(fusion.charge.evidence[0].length, 2);
});

test("fuseBeliefWithEvidence on mixed observations: weighted support fraction, charge settles at top and conflicted is true", () => {
  const observations = [
    { stance: "supports", description: "AUM grew 12% YoY", weight: 3 },
    { stance: "contradicts", description: "a competitor undercut fee structure", weight: 1 },
  ];
  const fusion = fuseBeliefWithEvidence(observations);
  assert.equal(fusion.supportFraction, 0.75);
  assert.deepEqual(fusion.charge.value, [true, true]);
  assert.equal(fusion.conflicted, true);
  assert.equal(isTop(fusion.charge), true);
  assert.equal(fusion.charge.evidence[0].length, 1);
  assert.equal(fusion.charge.evidence[1].length, 1);
});

test("fuseBeliefWithEvidence defaults every observation's weight to 1 when omitted", () => {
  const observations = [
    { stance: "supports", description: "a" },
    { stance: "contradicts", description: "b" },
  ];
  const fusion = fuseBeliefWithEvidence(observations);
  assert.equal(fusion.supportFraction, 0.5);
});

test("fuseBeliefWithEvidence rejects an observation with a negative weight", () => {
  assert.throws(() => fuseBeliefWithEvidence([{ stance: "supports", description: "a", weight: -1 }]), /weight/u);
});
