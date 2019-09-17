const parseCoverage = (coverage) => (
  coverage.map(({ ranges, url, text }) => {
    const total = text.length;
    const used = ranges.reduce((acc, { start, end }) => acc + (end - start), 0) / total;

    return {
      url,
      used,
      total,
      ranges
    }
  })
);

const writeCoverage = async (page) => {
  await Promise.all([
    page.coverage.startJSCoverage(),
    page.coverage.startCSSCoverage()
  ]);

  return async () => {
    const [js, css] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage(),
    ]);

    return parseCoverage([...js, ...css]);
  };
};

module.exports = {
  writeCoverage,

};
