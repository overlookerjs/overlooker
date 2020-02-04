const { divide, summ } = require('../objects-utils.js');
const { normalizeEvaluationSummary } = require('./aggregation-evaluation.js');
const { normalizeCoverageSummary } = require('./aggregation-coverage.js');

const clearUrl = (url) => url && url.replace(/\?.*?$/, '');

const getNetworkSummary = (network, inception = {}, merge) => {
  return network
    .reduce((networkSummary, {
      url,
      timings,
      size,
      transfer,
      evaluation,
      coverage,
      ...rest
    }) => {
      const similarMergedUrl = url && merge ? merge(url) : false;
      const clearedUrl = similarMergedUrl || clearUrl(url);

      if (networkSummary[clearedUrl]) {
        const similarSummary = networkSummary[clearedUrl];

        networkSummary[clearedUrl] = {
          size: size + similarSummary.size,
          transfer: transfer + similarSummary.transfer,
          timings: similarSummary.timings ? summ(similarSummary.timings, timings) : timings,
          count: similarSummary.count + 1,
          evaluation: similarSummary.evaluation.concat([evaluation]),
          coverage: similarSummary.coverage.concat(coverage),
          url,
          ...rest
        };
      } else {
        networkSummary[clearedUrl] = {
          url,
          timings,
          size,
          transfer,
          count: 1,
          evaluation: [evaluation],
          coverage: [coverage],
          ...rest
        };
      }

      return networkSummary;
    }, inception);
};

const normalizeNetworkSummary = (summaryNetwork) => Object.entries(summaryNetwork)
  .map(([url, {
    internal,
    timings,
    size,
    type,
    transfer,
    evaluation,
    coverage,
    count,
    ...rest
  }]) => ({
    size: size / count,
    transfer: transfer / count,
    timings: divide(timings, count),
    evaluation: normalizeEvaluationSummary(evaluation),
    coverage: normalizeCoverageSummary(coverage),
    type,
    url,
    count,
    internal,
    ...rest
  }))
  .sort(({ size: fSize }, { size: sSize }) => sSize - fSize);

module.exports = {
  getNetworkSummary,
  normalizeNetworkSummary
};
