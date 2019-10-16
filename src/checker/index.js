const checkPageWithThresholds = (page, thresholdsEntries) => thresholdsEntries
  .map(([path, threshold]) => {
    let value = page;

    for (const key of path) {
      value = value[key];
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
      checkPageWithThresholds(data, thresholdsEntries)
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
