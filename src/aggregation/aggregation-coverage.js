const { summ, divide } = require('./../objects-utils.js');

const normalizeCoverageSummary = (coverageSummary) => {
  const separated = coverageSummary
    .filter(Boolean)
    .map(({ ranges, ...stats }) => ({ ranges, stats }));

  if (separated.length) {
    const aggregatedStats = divide(
      separated
        .map(({ stats }) => stats)
        .reduce((acc, obj) => summ(acc, obj)),
      separated.length
    );

    const aggregatedRanges = separated
      .sort(({ stats: { used: fu } }, { stats: { used: su } }) => fu - su)[Math.floor(separated.length / 2)].ranges;

    return aggregatedStats;
  } else {
    return null;
  }
};

module.exports = {
  normalizeCoverageSummary
};
