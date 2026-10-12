/**
 * The belief-to-capital algebra's `belief edge(i)` formula from
 * PERSONAL-QUANT-PLATFORM-THEORY.md ("The belief-to-capital algebra"):
 * `E[(forecast value(i)/market price(i)) - 1] * calibrated confidence(i)
 * * horizon compatibility(i) - uncertainty penalty(i) - transition cost(i)`.
 * Each term is a separate, independently unit-testable function; confidence
 * never manufactures expected return and costs never rewrite the forecast.
 */

import { createFieldValidators } from "./internal/validators.mjs";

const { requireFiniteNumber } = createFieldValidators("belief-edge");

function requireNonNegative(value, label) {
  requireFiniteNumber(value, label);
  if (value < 0) throw new TypeError(`belief-edge: ${label} must be >= 0, got ${value}`);
  return value;
}

function requirePositive(value, label) {
  requireFiniteNumber(value, label);
  if (value <= 0) throw new TypeError(`belief-edge: ${label} must be > 0, got ${value}`);
  return value;
}

function requireUnitInterval(value, label) {
  requireFiniteNumber(value, label);
  if (value < 0 || value > 1) throw new TypeError(`belief-edge: ${label} must be in [0,1], got ${value}`);
  return value;
}

/**
 * `E[(forecast value(i)/market price(i)) - 1]`: the expected forecast-to-market
 * premium. `forecastValue` may be one point estimate or an array of scenario
 * samples (a Monte Carlo distribution), in which case the expectation is the
 * sample mean.
 * @param {number|number[]} forecastValue A forecast value, or an array of scenario-sampled forecast values.
 * @param {number} marketPrice The current executable market price; must be > 0.
 * @returns {number} the expected value of `(forecastValue/marketPrice) - 1`.
 * @throws {TypeError} when `marketPrice` is not a positive finite number, or `forecastValue` is malformed.
 */
export function expectedForecastPremium(forecastValue, marketPrice) {
  requirePositive(marketPrice, "marketPrice");
  const samples = Array.isArray(forecastValue) ? forecastValue : [forecastValue];
  if (samples.length === 0) throw new TypeError("belief-edge: forecastValue array must be non-empty");
  samples.forEach((sample, index) => requireFiniteNumber(sample, `forecastValue[${index}]`));
  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  return mean / marketPrice - 1;
}

/**
 * `calibrated confidence(i)`: the principal's raw stated confidence adjusted
 * by an optional historical calibration multiplier (how often that
 * confidence level has actually been right), clamped to [0,1]. Confidence
 * alone never manufactures expected return -- it only scales the premium
 * term computed separately by {@link expectedForecastPremium}.
 * @param {number} rawConfidence The principal's stated confidence, in [0,1].
 * @param {number} [calibrationMultiplier] An optional multiplier from a calibration curve; defaults to 1 (no adjustment).
 * @returns {number} the calibrated confidence, clamped to [0,1].
 * @throws {TypeError} when `rawConfidence` is outside [0,1] or `calibrationMultiplier` is negative.
 */
export function calibratedConfidence(rawConfidence, calibrationMultiplier = 1) {
  requireUnitInterval(rawConfidence, "rawConfidence");
  requireNonNegative(calibrationMultiplier, "calibrationMultiplier");
  return Math.min(1, rawConfidence * calibrationMultiplier);
}

/**
 * `horizon compatibility(i)`: how well the belief's stated horizon matches
 * the forecast's horizon, in [0,1] (1 = identical horizons, falling toward 0
 * as the two diverge). Both horizons must be expressed in the same unit
 * (e.g. both in days) before calling this function.
 * @param {number} beliefHorizon The belief's stated horizon, in some time unit; must be > 0.
 * @param {number} forecastHorizon The forecast's horizon, in the same time unit; must be > 0.
 * @returns {number} the horizon compatibility, in [0,1].
 * @throws {TypeError} when either horizon is not a positive finite number.
 */
export function horizonCompatibility(beliefHorizon, forecastHorizon) {
  requirePositive(beliefHorizon, "beliefHorizon");
  requirePositive(forecastHorizon, "forecastHorizon");
  const longer = Math.max(beliefHorizon, forecastHorizon);
  const gap = Math.abs(beliefHorizon - forecastHorizon);
  return 1 - gap / longer;
}

/**
 * `uncertainty penalty(i)`: a non-negative penalty scaled from the
 * forecast's own spread (e.g. a standard deviation or interquartile range
 * over the forecast distribution) by a weight. Kept as a separate
 * subtracted term rather than folded into confidence, per the theory
 * document's decomposition requirement.
 * @param {number} forecastSpread A non-negative measure of the forecast distribution's spread.
 * @param {number} [penaltyWeight] The weight applied to that spread; defaults to 1.
 * @returns {number} the non-negative uncertainty penalty.
 * @throws {TypeError} when `forecastSpread` or `penaltyWeight` is negative or not finite.
 */
export function uncertaintyPenalty(forecastSpread, penaltyWeight = 1) {
  requireNonNegative(forecastSpread, "forecastSpread");
  requireNonNegative(penaltyWeight, "penaltyWeight");
  return forecastSpread * penaltyWeight;
}

/**
 * `transition cost(i)`: the non-negative fractional cost (taxes,
 * transaction costs, liquidity impact) of acting on this belief. Kept as a
 * separate subtracted term rather than baked into the forecast, per the
 * theory document's decomposition requirement.
 * @param {number} costFraction A non-negative fraction of position value consumed by transitioning into this belief.
 * @returns {number} the non-negative transition cost, unchanged.
 * @throws {TypeError} when `costFraction` is negative or not finite.
 */
export function transitionCost(costFraction) {
  return requireNonNegative(costFraction, "costFraction");
}

/**
 * Computes the full `belief edge(i)` from
 * PERSONAL-QUANT-PLATFORM-THEORY.md's belief-to-capital algebra, composing
 * each term above without folding them together.
 * @param {object} terms
 * @param {number|number[]} terms.forecastValue A forecast value, or scenario samples of one.
 * @param {number} terms.marketPrice The current executable market price.
 * @param {number} terms.rawConfidence The principal's stated confidence, in [0,1].
 * @param {number} [terms.calibrationMultiplier] Optional calibration multiplier; defaults to 1.
 * @param {number} terms.beliefHorizon The belief's stated horizon.
 * @param {number} terms.forecastHorizon The forecast's horizon, in the same unit as `beliefHorizon`.
 * @param {number} [terms.forecastSpread] A non-negative forecast-spread measure; defaults to 0.
 * @param {number} [terms.uncertaintyPenaltyWeight] Weight applied to `forecastSpread`; defaults to 1.
 * @param {number} [terms.transitionCostFraction] A non-negative transition-cost fraction; defaults to 0.
 * @returns {{beliefEdge: number, expectedForecastPremium: number, calibratedConfidence: number, horizonCompatibility: number, uncertaintyPenalty: number, transitionCost: number}} the belief edge and its named, auditable terms.
 * @throws {TypeError} when any underlying term function refuses its input.
 */
export function computeBeliefEdge({
  forecastValue,
  marketPrice,
  rawConfidence,
  calibrationMultiplier = 1,
  beliefHorizon,
  forecastHorizon,
  forecastSpread = 0,
  uncertaintyPenaltyWeight = 1,
  transitionCostFraction = 0,
}) {
  const premium = expectedForecastPremium(forecastValue, marketPrice);
  const confidence = calibratedConfidence(rawConfidence, calibrationMultiplier);
  const compatibility = horizonCompatibility(beliefHorizon, forecastHorizon);
  const penalty = uncertaintyPenalty(forecastSpread, uncertaintyPenaltyWeight);
  const cost = transitionCost(transitionCostFraction);
  const beliefEdge = premium * confidence * compatibility - penalty - cost;
  return {
    beliefEdge,
    expectedForecastPremium: premium,
    calibratedConfidence: confidence,
    horizonCompatibility: compatibility,
    uncertaintyPenalty: penalty,
    transitionCost: cost,
  };
}
