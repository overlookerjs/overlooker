const mime = require('mime-types');
const { getExtension } = require('./../utils.js');
const { map } = require('./../objects-utils.js');
const { findEventByName, filterEventsByName } = require('./events-helpers.js');

const imagesTypes = ['jpg', 'jpeg', 'png', 'svg', 'ico', 'gif', 'webp'];
const fontsTypes = ['woff', 'woff2', 'ttf', 'eot'];
const jsTypes = ['js'];
const cssTypes = ['css'];
const htmlTypes = ['html'];
const totalTypes = [];

const filterNetworkEvents = (events) => filterEventsByName(events, [
  'ResourceSendRequest',
  'ResourceReceivedData',
  'ResourceReceiveResponse',
  'ResourceFinish'
])
  .reduce((acc, item) => {
    if (!acc[item.args.data.requestId]) {
      acc[item.args.data.requestId] = [];
    }

    acc[item.args.data.requestId].push(item);

    return acc
  }, {});

const separateNetworkEvents = (networkEvents) => Object.values(networkEvents)
  .map((items) => ({
    request: findEventByName(items, 'ResourceSendRequest'),
    response: findEventByName(items, 'ResourceReceiveResponse'),
    data: filterEventsByName(items, 'ResourceReceivedData'),
    finish: findEventByName(items, 'ResourceFinish')
  }))
  .filter(({ finish, request, response }) => finish && request && response);

const prepareSeparatedNetwork = (separatedNetwork, evaluationMap, coverageMap, internalTest) => separatedNetwork
  .map(({
          request: { args: { data: { url, requestMethod } } },
          response: { args: { data: { mimeType, statusCode } } },
          finish: { args: { data: { decodedBodyLength, encodedDataLength } } },
          request,
          response,
          finish,
          data
        }) => ({
      url,
      stats: {
        size: decodedBodyLength,
        transfer: encodedDataLength,
        evaluation: evaluationMap[url] && evaluationMap[url].reduce((acc, { duration }) => acc + duration, 0),
        timings: {
          start: request.ts,
          response: response.ts,
          firstByte: data
            .reduce((acc, { ts }) => (
              acc > ts ? ts : acc
            ), data[0] ? data[0].ts : response.ts),
          finish: finish.ts,
          total: finish.ts - request.ts
        },
        coverage: coverageMap[url]
      },
      evaluation: evaluationMap[url],
      internal: internalTest(url),
      type: mimeType,
      extension: mime.extension(mimeType) || getExtension(url),
      status: statusCode,
      method: requestMethod || 'GET'
    })
  );

const parseNetwork = (events, evaluationMap, coverageMap, internalTest) => prepareSeparatedNetwork(
  separateNetworkEvents(
    filterNetworkEvents(events)
  ),
  evaluationMap,
  coverageMap,
  internalTest
);

const filterNetwork = (network, extensions) => network
  .filter(({ extension }) => !extensions.length || extensions.includes(extension));

const summarizeSizes = (network) => network.reduce((acc, { stats: { size } }) => acc + size, 0);
const summarizeTransfer = (network) => network.reduce((acc, { stats: { transfer } }) => acc + transfer, 0);
const summarizeCoverage = (network) => network.reduce((acc, { stats: { coverage } }) => {
  if (coverage) {
    acc.total += coverage.absolute.total;
    acc.unused += coverage.absolute.unused;
    acc.used += coverage.absolute.used;
  }

  return acc;
}, {
  total: 0,
  unused: 0,
  used: 0
});

const addCoveragePercent = (coverage) => ({
  absolute: coverage,
  percent: {
    used: coverage.total ? coverage.used / coverage.total : 0,
    unused: coverage.total ? coverage.unused / coverage.total : 0
  }
});

const splitNetworkByTypes = (network, types) => map(
  types,
  (filter) => filter ? filterNetwork(network, filter) : network
);

const splitNetworkByLocation = (network) => ({
  internal: network.filter(({ internal }) => internal),
  external: network.filter(({ internal }) => !internal)
});

const castNetworkToResources = (network) => map(
  splitNetworkByTypes(network, {
    total: totalTypes,
    js: jsTypes,
    css: cssTypes,
    images: imagesTypes,
    fonts: fontsTypes,
    html: htmlTypes
  }),
  (filteredNetwork) => ({
    size: summarizeSizes(filteredNetwork),
    transfer: summarizeTransfer(filteredNetwork)
  })
);

const castNetworkToTotalCoverage = (network) => map(
  splitNetworkByTypes(network, {
    js: jsTypes,
    css: cssTypes
  }),
  (filteredNetwork) => addCoveragePercent(summarizeCoverage(filteredNetwork))
);

const getNetworkStats = (statsGetter, network) => {
  const { internal, external } = splitNetworkByLocation(network);

  return {
    total: statsGetter(network),
    internal: statsGetter(internal),
    external: statsGetter(external)
  };
};

const getResourcesStats = (network) => getNetworkStats(castNetworkToResources, network);

const getCoverageStats = (network) => getNetworkStats(castNetworkToTotalCoverage, network);

module.exports = {
  parseNetwork,
  getResourcesStats,
  getCoverageStats
};
