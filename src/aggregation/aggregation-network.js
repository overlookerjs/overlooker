const { deepConcat } = require('../objects-utils.js');
const { aggregateEvaluation } = require('./aggregation-evaluation.js');

const clearUrl = (url) => url && url.replace(/\?.*?$/, '');

const concatNetworks = (network, inception = {}, merge) => {
  return network
    .reduce((networkSummary, request) => {
      const { url } = request;
      const similarMergedUrl = url && merge ? merge(url) : false;
      const clearedUrl = similarMergedUrl || clearUrl(url);

      if (networkSummary[clearedUrl]) {
        networkSummary[clearedUrl].push(request);
      } else {
        networkSummary[clearedUrl] = [request];
      }

      return networkSummary;
    }, inception);
};

const concatRequests = (requests) => requests
  .reduce((acc, {
    stats,
    evaluation,
    ...rest
  }) => ({
    stats: deepConcat(acc.stats, stats),
    evaluation: acc.evaluation ? acc.evaluation.concat([evaluation]) : [evaluation],
    ...rest
  }), {});

const aggregateRequests = (aggregation, requests, {
  stats,
  evaluation,
  ...rest
}) => ({
  stats: aggregation(stats),
  evaluation: aggregateEvaluation(evaluation),
  count: requests.reduce((acc, { count }) => acc + (count || 0), 0) || requests.length,
  ...rest
});

const aggregateNetwork = (aggregation, summaryNetwork) => Object.entries(summaryNetwork)
  .filter(([, requests]) => requests.length)
  .map(([url, requests]) => [
    requests,
    {
      ...concatRequests(requests),
      url
    }
  ])
  .map(([requests, summarizedRequests]) => aggregateRequests(aggregation, requests, summarizedRequests))
  .sort(({ stats: { size: fSize } }, { stats: { size: sSize } }) => sSize - fSize);

module.exports = {
  concatNetworks,
  aggregateNetwork
};
