/**
 * Approximates the Gauss error function, the probability that a random variable
 * from the standard normal distribution lies within [-x, x]. Moved from
 * traceviewer.b.math.erf, based on Abramowitz and Stegun, formula 7.1.26.
 * @param {number} x
 * @return {number}
 */
function erf(x) {
  // erf(-x) = -erf(x);
  const sign = Math.sign(x);
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  return sign * (1 - y * Math.exp(-x * x));
}

/**
 * Returns the score (1 - percentile) of `value` in a log-normal distribution
 * specified by the `median` value, at which the score will be 0.5, and a 10th
 * percentile value, at which the score will be 0.9. The score represents the
 * amount of the distribution greater than `value`. All values should be in the
 * same units (e.g. milliseconds). See
 *   https://www.desmos.com/calculator/o98tbeyt1t
 * for an interactive view of the relationship between these parameters and the
 * typical parameterization (location and shape) of the log-normal distribution.
 * @param {{median: number, p10: number}} parameters
 * @param {number} value
 * @return {number}
 */
function getLogNormalScore({ median, p10 }, value) {
  // Required for the log-normal distribution.
  if (median <= 0) throw new Error('median must be greater than zero');
  if (p10 <= 0) throw new Error('p10 must be greater than zero');
  // Not required, but if p10 > median, it flips around and becomes the p90 point.
  if (p10 >= median) throw new Error('p10 must be less than the median');

  // Non-positive values aren't in the distribution, so always 1.
  if (value <= 0) return 1;

  // Closest double to `erfc-1(2 * 1/10)`.
  const INVERSE_ERFC_ONE_FIFTH = 0.9061938024368232;

  // Shape (σ) is `log(p10/median) / (sqrt(2)*erfc^-1(2 * 1/10))` and
  // standardizedX is `1/2 erfc(log(value/median) / (sqrt(2)*σ))`, so simplify a bit.
  const xLogRatio = Math.log(value / median);
  const p10LogRatio = -Math.log(p10 / median); // negate to keep σ positive.
  const standardizedX = xLogRatio * INVERSE_ERFC_ONE_FIFTH / p10LogRatio;
  const complementaryPercentile = (1 - erf(standardizedX)) / 2;

  // Clamp to [0, 1] to avoid any floating-point out-of-bounds issues.
  return Math.min(1, Math.max(0, complementaryPercentile));
}

module.exports = {
  getLogNormalScore
};
