const { flat } = require('./../utils.js');

const bunchRegExp = /\{[\s\n]*([\s\S]*?)[\s\n]*\}/;

const checkPages = (page, thresholds) => Object.entries(thresholds)
  .map(([path, threshold]) => {
    const splitPath = path.split('.');
    let value = page;

    for (let index = 0; index < splitPath.length; index++) {
      const key = splitPath[index];
      if (bunchRegExp.test(key)) {
        const entries = key.match(bunchRegExp)[1].split(/[\n\s]*,[\n\s]*/);

        return checkPages(
          page,
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
      success: value <= threshold
    };
  });

const check = (comparing, thresholdsByPage) => {
  const results = Object.entries(comparing)
    .map(([page, data]) => [
      page,
      flat(checkPages(data, thresholdsByPage[page] || thresholdsByPage['default'] || []))
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

module.exports = { check, checkPages };
