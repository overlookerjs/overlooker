const { flat } = require('./../utils.js');
const { make } = require('./../objects-utils.js');

const statuses = {
  WARNING: 'warning',
  WORSENING: 'worsening',
  PARTIAL_WORSENING: 'partial_worsening',
  IMPROVEMENT: 'improvement',
  PARTIAL_IMPROVEMENT: 'partial_improvement',
  WITHOUT_CHANGES: 'without_changes'
};

const checkValue = (value, threshold) => {
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
};

const bunchRegExp = /\{[\s\n]*([\s\S]*?)[\s\n]*\}/;

const check = (comparison, thresholds) => Object.entries(thresholds)
  .map(([path, threshold]) => {
    const splitPath = path.split('.');
    let value = comparison;

    for (let index = 0; index < splitPath.length; index++) {
      const key = splitPath[index];
      if (bunchRegExp.test(key)) {
        const entries = key.match(bunchRegExp)[1].split(/[\n\s]*,[\n\s]*/);

        return check(
          comparison,
          entries.map((entry) => {
            const replacedPath = splitPath.slice();
            replacedPath.splice(index, 1, entry);

            return [replacedPath, threshold];
          })
        );
      } else {
        value = value[key];
      }
    }

    return {
      path,
      splitPath,
      threshold,
      value,
      difference: value - threshold,
      status: checkValue(value, threshold)
    };
  });

const checkPages = (comparisons, thresholdsByPage) => {
  const results = make(
    Object.entries(comparisons)
      .map(([page, comparison]) => [
        page,
        flat(check(comparison, thresholdsByPage[page] || thresholdsByPage['default'] || {}))
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
