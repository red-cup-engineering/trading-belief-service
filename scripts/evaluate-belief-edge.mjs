#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeBeliefEdge } from "../src/belief-edge.mjs";

/**
 * Reads a belief-edge input (forecastValue, marketPrice, rawConfidence,
 * beliefHorizon, forecastHorizon, and optional calibration/spread/cost
 * terms -- see `computeBeliefEdge`'s own JSDoc for the full shape) and
 * returns the computed belief-edge result.
 * @param {object} input The belief-edge term arguments `computeBeliefEdge` accepts.
 * @returns {ReturnType<typeof computeBeliefEdge>} the belief edge and its named terms.
 * @throws {TypeError} when `input` is malformed, propagated from `computeBeliefEdge`.
 */
export function evaluateBeliefEdge(input) {
  return computeBeliefEdge(input);
}

if (import.meta.main) {
  const [path] = process.argv.slice(2);
  if (!path) {
    process.stderr.write("usage: evaluate-belief-edge.mjs <belief-edge-input.json>\n");
    process.exitCode = 2;
  } else {
    const input = JSON.parse(readFileSync(resolve(path), "utf8"));
    process.stdout.write(`${JSON.stringify(evaluateBeliefEdge(input), null, 2)}\n`);
  }
}
