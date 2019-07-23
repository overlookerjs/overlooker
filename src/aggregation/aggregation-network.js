const { objDevide, objSumm } = require('../utils.js');

const clearUrl = (url) => url && url.replace(/\?.*?$/, '');

const getNetworkSummary = (network, inception = {}, merge) => {
  return network
    .reduce((networkSummary, {
      url,
      timings,
      size,
      transfer,
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
    count
  }]) => ({
    size: size / count,
    transfer: transfer / count,
    timings: objDevide(timings, count),
    type,
    url,
    count,
    internal
  }))
  .sort(({ size: fSize }, { size: sSize }) => sSize - fSize);

module.exports = {
  getNetworkSummary,
  normalizeNetworkSummary
};
