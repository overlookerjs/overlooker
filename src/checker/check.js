const { flat } = require('./../utils.js');
const { make, toArray, pathPatternToRegExp } = require('./../objects-utils.js');

const statuses = {
  WARNING: 'warning',
  WORSENING: 'worsening',
  PARTIAL_WORSENING: 'partial_worsening',
  IMPROVEMENT: 'improvement',
  PARTIAL_IMPROVEMENT: 'partial_improvement',
  WITHOUT_CHANGES: 'without_changes'
};

const checkValue = (value, threshold) => {
  if (threshold > 0) {
    if (value > threshold) {
      return statuses.WORSENING;
    } else if (value > threshold / 2) {
      return statuses.PARTIAL_WORSENING;
    } else if (value < -threshold) {
      return statuses.IMPROVEMENT;
    } else if (value < -threshold / 2) {
      return statuses.PARTIAL_IMPROVEMENT;
    } else {
      return statuses.WITHOUT_CHANGES;
    }
  } else {
    if (value < threshold) {
      return statuses.WORSENING;
    } else if (value < threshold / 2) {
      return statuses.PARTIAL_WORSENING;
    } else if (value > -threshold) {
      return statuses.IMPROVEMENT;
    } else if (value > -threshold / 2) {
      return statuses.PARTIAL_IMPROVEMENT;
    } else {
      return statuses.WITHOUT_CHANGES;
    }
  }
};

const check = (comparison, thresholds) => {
  const comparisonsArray = toArray(comparison);

  return flat(Object.entries(thresholds) // ToDo: it should be more simple
    .map(([thresholdPath, threshold]) => {
      const regExp = pathPatternToRegExp(thresholdPath);
      const matchedPaths = comparisonsArray.filter(([path]) => regExp.test(path));

      return matchedPaths.map(([comparisonPath, value]) => ({
        path: comparisonPath,
        splitPath: comparisonPath.split('.'),
        threshold,
        value,
        difference: value - threshold,
        status: checkValue(value, threshold)
      }));
    })
    .filter(Boolean));
};

const checkPages = (comparisons, thresholdsByPage) => {
  const results = make(
    Object.entries(comparisons)
      .map(([page, comparison]) => [
        page,
        check(comparison, thresholdsByPage[page] || thresholdsByPage['default'] || {})
          .filter(Boolean)
      ])
      .map(([page, results]) => [page, {
          success: results.every(({ status }) => status !== statuses.WORSENING),
          results
        }]
      )
  );

  return {
    success: Object.values(results).every(({ success }) => success),
    results
  }
};

module.exports = {
  checkPages,
  check,
  statuses
};
