const { flat } = require('./../utils.js');

const bunchRegExp = /\{[\s\n]*([\s\S]*?)[\s\n]*\}/;

const checkPageWithThresholds = (page, thresholdsEntries) => thresholdsEntries
  .map(([path, threshold]) => {
    let value = page;

    for (let index = 0; index < path.length; index++) {
      const key = path[index];
      if (bunchRegExp.test(key)) {
        const entries = key.match(bunchRegExp)[1].split(/[\n\s]*,[\n\s]*/);

        return checkPageWithThresholds(
          page,
          entries.map((entry) => {
            const replacedPath = path.slice();
            replacedPath.splice(index, 1, entry);

            return [replacedPath, threshold];
          })
        );
      } else {
        value = value[key];
      }
    }

    return value > threshold ? {
      path,
      threshold,
      value
    } : null;
  });

const getThresholdsEntries = (thresholds) => Object.entries(thresholds)
  .map(([path, threshold]) => [path.split('.'), threshold]);

const check = (comparing, thresholds) => {
  const thresholdsEntries = getThresholdsEntries(thresholds);

  const results = Object.entries(comparing)
    .map(([page, data]) => [
      page,
      flat(checkPageWithThresholds(data, thresholdsEntries))
        .filter(Boolean)
    ])
    .filter(([, results]) => results.length)
    .reduce((acc, [page, results]) => {
      acc[page] = {
        success: !Boolean(Object.keys(results).length),
        results
      };
      return acc;
    }, {});

  return {
    success: !Boolean(Object.keys(results).length),
    results
  }
};

const checkPage = (page, thresholds) => checkPageWithThresholds(page, getThresholdsEntries(thresholds));

module.exports = { check, checkPage };
