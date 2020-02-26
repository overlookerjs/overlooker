const { divide, summ } = require('../objects-utils.js');

const aggregateEvaluation = (evaluation = []) => {
  const clearEvaluation = evaluation.filter(Boolean);

  return clearEvaluation && clearEvaluation.length ? (
    Array(clearEvaluation[0].length)
      .fill(null)
      .map((i, index) => clearEvaluation.map((evaluation) => evaluation[index]))
      .map((mergedEvaluation) => ({
        url: mergedEvaluation[0].url,
        duration: mergedEvaluation
          .reduce((acc, { duration = 0 } = {}) => acc + duration, 0) / mergedEvaluation.length,
        timings: divide(
          mergedEvaluation
            .filter(Boolean)
            .map(({ timings }) => timings)
            .reduce(summ),
          mergedEvaluation.length
        )
      }))
  ) : (
    []
  )
};

module.exports = {
  aggregateEvaluation
};
