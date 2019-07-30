const { objDivide, objSumm } = require('../objects-utils.js');
const { normalizeEvaluatingSummary } = require('./aggregation-evaluating');

const clearUrl = (url) => url && url.replace(/\?.*?$/, '');

const getNetworkSummary = (network, inception = {}, merge) => {
  return network
    .reduce((networkSummary, {
      url,
      timings,
      size,
      transfer,
      evaluating,
      ...rest
    }) => {
      const similarMergedUrl = url && merge ? merge(url) : false;
      const clearedUrl = similarMergedUrl || clearUrl(url);

      if (networkSummary[clearedUrl]) {
        const similarSummary = networkSummary[clearedUrl];

        networkSummary[clearedUrl] = {
          size: size + similarSummary.size,
          transfer: transfer + similarSummary.transfer,
          timings: similarSummary.timings ? objSumm(similarSummary.timings, timings) : timings,
          count: similarSummary.count + 1,
          evaluating: similarSummary.evaluating.concat([evaluating]),
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
          evaluating: [evaluating],
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
    evaluating,
    count,
    ...rest
  }]) => ({
    size: size / count,
    transfer: transfer / count,
    timings: objDivide(timings, count),
    evaluating: normalizeEvaluatingSummary(evaluating),
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
