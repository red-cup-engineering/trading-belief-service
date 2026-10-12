#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fuseBeliefWithEvidence } from "../src/evidence-fusion.mjs";

/**
 * Reads a JSON array of belief observations (`{stance, description,
 * weight?}` per {@link import("../src/evidence-fusion.mjs").BeliefObservation})
 * and returns the fused evidence and numeric support fraction.
 * @param {import("../src/evidence-fusion.mjs").BeliefObservation[]} observations
 * @returns {ReturnType<typeof fuseBeliefWithEvidence>} the fusion result.
 * @throws {TypeError} when `observations` is malformed, propagated from `fuseBeliefWithEvidence`.
 */
export function fuseBeliefEvidence(observations) {
  return fuseBeliefWithEvidence(observations);
}

if (import.meta.main) {
  const [path] = process.argv.slice(2);
  if (!path) {
    process.stderr.write("usage: fuse-belief-with-evidence.mjs <belief-observations.json>\n");
    process.exitCode = 2;
  } else {
    const observations = JSON.parse(readFileSync(resolve(path), "utf8"));
    process.stdout.write(`${JSON.stringify(fuseBeliefEvidence(observations), null, 2)}\n`);
  }
}
