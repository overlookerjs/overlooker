const { objDevide, objSumm, objMap } = require('../utils.js');

const normalizeEvaluatingSummary = (evaluatings = {}) => (
  objMap(evaluatings, (evaluating) => {
    const clearEvaluating = evaluating
      .filter(Boolean);

    return clearEvaluating && clearEvaluating.length ? (
      Array(clearEvaluating[0].length)
        .fill(null)
        .map((i, index) => clearEvaluating.map((evaluating) => evaluating[index]))
        .map((mergedEvaluating) => ({
          url: mergedEvaluating[0].url,
          duration: mergedEvaluating
            .reduce((acc, { duration = 0 } = {}) => acc + duration, 0) / mergedEvaluating.length,
          timings: objDevide(
            mergedEvaluating
              .filter(Boolean)
              .map(({ timings }) => timings)
              .reduce(objSumm),
            mergedEvaluating.length
          )
        }))
    ) : (
      []
    );
  })
);

const getEvaluatingSummary = (evaluating, summaryEvaluating) => Object.entries(evaluating)
  .reduce((acc, [key, value]) => {
    if (!acc[key]) {
      acc[key] = [value];
    } else {
      acc[key].push(value);
    }

    return acc;
  }, summaryEvaluating);

module.exports = {
  normalizeEvaluatingSummary,
  getEvaluatingSummary
};
