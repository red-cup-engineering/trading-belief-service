import assert from "node:assert/strict";
import test from "node:test";
import { knowledgeReading, told } from "@red-cup-engineering/signcell/cell";
import { evidenceOfBeliefObservation, fuseBeliefWithEvidence } from "../src/evidence-fusion.mjs";

test("evidenceOfBeliefObservation reads a supporting observation as the positive-only FOUR value", () => {
  const evidence = evidenceOfBeliefObservation({ stance: "supports", description: "AUM grew 12% YoY" });
  assert.deepEqual(told(evidence), [true, false]);
  assert.equal(evidence.for.length, 1);
  assert.equal(evidence.against.length, 0);
  assert.equal(evidence.for[0].description, "AUM grew 12% YoY");
});

test("evidenceOfBeliefObservation reads a contradicting observation as the negative-only FOUR value", () => {
  const evidence = evidenceOfBeliefObservation({ stance: "contradicts", description: "a competitor undercut fee structure" });
  assert.deepEqual(told(evidence), [false, true]);
  assert.equal(evidence.for.length, 0);
  assert.equal(evidence.against.length, 1);
});

test("evidenceOfBeliefObservation rejects an invalid stance", () => {
  assert.throws(() => evidenceOfBeliefObservation({ stance: "neutral", description: "x" }), /stance/u);
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
  assert.deepEqual(told(fusion.evidence), [true, false]);
  assert.equal(fusion.conflicted, false);
  assert.equal(knowledgeReading(fusion.evidence) === "stable", false);
  assert.equal(fusion.evidence.for.length, 2);
});

test("fuseBeliefWithEvidence on mixed observations: weighted support fraction, charge settles at top and conflicted is true", () => {
  const observations = [
    { stance: "supports", description: "AUM grew 12% YoY", weight: 3 },
    { stance: "contradicts", description: "a competitor undercut fee structure", weight: 1 },
  ];
  const fusion = fuseBeliefWithEvidence(observations);
  assert.equal(fusion.supportFraction, 0.75);
  assert.deepEqual(told(fusion.evidence), [true, true]);
  assert.equal(fusion.conflicted, true);
  assert.equal(knowledgeReading(fusion.evidence) === "stable", true);
  assert.equal(fusion.evidence.for.length, 1);
  assert.equal(fusion.evidence.against.length, 1);
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
