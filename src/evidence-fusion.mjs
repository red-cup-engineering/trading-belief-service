/**
 * Fuses a belief's supporting/contrary observations via the real
 * SignChain `knowledgeJoin`,
 * following forecasting-services-section's evidence-fusion.mjs idiom --
 * see fuseBeliefWithEvidence for why qualitative fusion and numeric
 * support-weight aggregation are kept honestly separate.
 */

import { evidence, sidesOf } from "@red-cup-engineering/signcell/cell";
import { knowledgeJoin } from "@red-cup-engineering/signchain/bilattice";
import { createFieldValidators } from "./internal/validators.mjs";

/** @typedef {{stance: "supports"|"contradicts", description: string, weight?: number}} BeliefObservation One observation bearing on a belief, stated as support or contradiction with an optional relative weight. */

const { requireNonEmptyString } = createFieldValidators("evidence-fusion");

function validateObservation(observation, index = 0) {
  if (typeof observation !== "object" || observation === null) {
    throw new TypeError(`evidence-fusion: observations[${index}] must be an object`);
  }
  if (observation.stance !== "supports" && observation.stance !== "contradicts") {
    throw new TypeError(`evidence-fusion: observations[${index}].stance must be "supports" or "contradicts", got ${JSON.stringify(observation.stance)}`);
  }
  requireNonEmptyString(observation.description, `observations[${index}].description`);
  if (observation.weight !== undefined) {
    if (typeof observation.weight !== "number" || !Number.isFinite(observation.weight) || observation.weight < 0) {
      throw new TypeError(`evidence-fusion: observations[${index}].weight must be a non-negative finite number when present`);
    }
  }
  return observation;
}

/**
 * Encodes one belief observation as a SignCell evidence pair. THIS IS
 * OUR ENCODING CHOICE, not metrologic's: a "supports" stance asserts the
 * positive side, a "contradicts" stance asserts the negative side, and the
 * observation itself becomes a witness object placed in the evidence array
 * on whichever side it asserts, so nothing is lost when tellings are joined.
 * @param {BeliefObservation} observation
 * @returns {object} a SignCell evidence pair.
 */
export function evidenceOfBeliefObservation(observation) {
  validateObservation(observation);
  const { stance, description, weight = 1 } = observation;
  const witness = Object.freeze({ description, weight });
  const supports = stance === "supports";
  const refutes = stance === "contradicts";
  return evidence({ for: supports ? [witness] : [], against: refutes ? [witness] : [] });
}

/**
 * Fuses a belief's supporting and contrary observations into one bilattice
 * support/refutation evidence and one numeric support fraction. Two genuinely
 * different operations happen here, kept separate rather than one
 * pretending to be the other: (1) the `supportFraction` is an ordinary
 * weighted share of support versus contradiction -- ordinary numeric
 * aggregation, not metrologic's job; (2) the `evidence` is SignChain's
 * bilattice fusion (`knowledgeJoin`, the knowledge-order join from
 * SignChain): each observation's evidence (see
 * {@link evidenceOfBeliefObservation}) is joined pairwise, so the fused
 * evidence's value bits are TRUE on a side iff at least one observation
 * asserted that side, and its evidence arrays lose no witness. A fused
 * evidence told both ways ( i.e. "told both" in the knowledge order)
 * means the belief's evidence base is in genuine CONFLICT -- some
 * observations support, some contradict -- which is exactly the signal a
 * belief's falsifier discipline exists to surface, not paper over.
 * @param {BeliefObservation[]} observations
 * @returns {{supportFraction: number, evidence: {for: unknown[], against: unknown[]}, conflicted: boolean}}
 * @throws {TypeError} when `observations` is not a non-empty array of valid observations.
 */
export function fuseBeliefWithEvidence(observations) {
  if (!Array.isArray(observations) || observations.length === 0) {
    throw new TypeError("evidence-fusion: fuseBeliefWithEvidence requires a non-empty array of observations");
  }
  observations.forEach(validateObservation);
  const tellings = observations.map(evidenceOfBeliefObservation);
  const fused = tellings.reduce((left, right) => knowledgeJoin(left, right));
  const sumWeights = (rows) => rows.reduce((sum, observation) => sum + (observation.weight ?? 1), 0);
  const totalWeight = sumWeights(observations);
  const supportWeight = sumWeights(observations.filter((observation) => observation.stance === "supports"));
  const supportFraction = totalWeight > 0 ? supportWeight / totalWeight : 0.5;
  return { supportFraction, evidence: fused, conflicted: sidesOf(fused)[0] && sidesOf(fused)[1] };
}
