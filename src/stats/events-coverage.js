const makeCoverageMap = (coverage) => coverage
  .reduce((acc, {url, ...rest}) => {
    acc[url] = rest;

    return acc;
  }, {});

module.exports = {
  makeCoverageMap
};
