const { objDivide, objSumm } = require('../objects-utils.js');

const normalizeEvaluatingSummary = (evaluating = []) => {
  const clearEvaluating = evaluating.filter(Boolean);

  return clearEvaluating && clearEvaluating.length ? (
    Array(clearEvaluating[0].length)
      .fill(null)
      .map((i, index) => clearEvaluating.map((evaluating) => evaluating[index]))
      .map((mergedEvaluating) => ({
        url: mergedEvaluating[0].url,
        duration: mergedEvaluating
          .reduce((acc, { duration = 0 } = {}) => acc + duration, 0) / mergedEvaluating.length,
        timings: objDivide(
          mergedEvaluating
            .filter(Boolean)
            .map(({ timings }) => timings)
            .reduce(objSumm),
          mergedEvaluating.length
        )
      }))
  ) : (
    []
  )
};

module.exports = {
  normalizeEvaluatingSummary
};
