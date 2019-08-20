const check = (comparing, thresholds) => {
  const thresholdsEntries = Object.entries(thresholds)
    .map(([path, threshold]) => [path.split('.'), threshold]);

  const results = Object.entries(comparing)
    .map(([page, data]) => [
      page,
      thresholdsEntries
        .map(([path, threshold]) => {
          let value = data;

          for (const key of path) {
            value = value[key];
          }

          return value > threshold ? {
            path,
            threshold,
            value
          } : null;
        })
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


module.exports = { check };
