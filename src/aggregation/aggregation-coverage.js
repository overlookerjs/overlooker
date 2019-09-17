const { objSumm, objDivide } = require('./../objects-utils.js');

const normalizeCoverageSummary = (coverageSummary) => {
  const separated = coverageSummary
    .filter(Boolean)
    .map(({ ranges, ...stats }) => ({ ranges, stats }));

  if (separated.length) {
    const aggregatedStats = objDivide(
      separated
        .map(({ stats }) => stats)
        .reduce((acc, obj) => objSumm(acc, obj)),
      separated.length
    );

    const aggregatedRanges = separated
      .sort(({ stats: { used: fu } }, { stats: { used: su } }) => fu - su)[Math.floor(separated.length / 2)].ranges;

    return {
      ...aggregatedStats,
      ranges: aggregatedRanges
    };
  } else {
    return null;
  }
};

module.exports = {
  normalizeCoverageSummary
};
