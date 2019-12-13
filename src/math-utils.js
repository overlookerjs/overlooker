const mde = (stdev, n) => (
  2 * stdev / Math.sqrt(n) * (jStat.studentt.inv(1 - 0.2, n - 2) + jStat.studentt.inv(1 - 0.025, n - 2))
);

module.exports = {
  mde
};
