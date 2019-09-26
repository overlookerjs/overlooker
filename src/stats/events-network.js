const mime = require('mime-types');
const { getExtension } = require('./../utils.js');
const { objMap } = require('./../objects-utils.js');
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

const prepareSeparatedNetwork = (separatedNetwork, evaluatingMap, coverageMap, internalTest) => separatedNetwork
  .map(({
          request,
          request: { args: { data: { url } } },
          response,
          data,
          finish
        }) => ({
      url,
      evaluating: evaluatingMap[url],
      coverage: coverageMap[url],
      internal: internalTest(url),
      type: response.args.data.mimeType,
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
      extension: mime.extension(response.args.data.mimeType) || getExtension(url),
      size: finish.args.data.decodedBodyLength,
      transfer: finish.args.data.encodedDataLength,
    })
  );

const parseNetwork = (events, evaluatingMap, coverageMap, internalTest) => prepareSeparatedNetwork(
  separateNetworkEvents(
    filterNetworkEvents(events)
  ),
  evaluatingMap,
  coverageMap,
  internalTest
);

const filterNetwork = (network, extensions) => network
  .filter(({ extension }) => !extensions.length || extensions.includes(extension));

const summarizeSizes = (network) => network.reduce((acc, { size }) => acc + size, 0);
const summarizeTransfer = (network) => network.reduce((acc, { transfer }) => acc + transfer, 0);
const summarizeCoverage = (network) => network.reduce((acc, { coverage }) => {
  if (coverage) {
    acc.total += coverage.total;
    acc.used += coverage.used;
  }

  return acc;
}, {
  total: 0,
  used: 0
});

const splitNetworkByTypes = (network, types) => objMap(
  types,
  (filter) => filter ? filterNetwork(network, filter) : network
);

const splitNetworkByLocation = (network) => ({
  internal: network.filter(({ internal }) => internal),
  external: network.filter(({ internal }) => !internal)
});

const castNetworkToResources = (network) => objMap(
  splitNetworkByTypes(network, {
    images: imagesTypes,
    fonts: fontsTypes,
    js: jsTypes,
    css: cssTypes,
    html: htmlTypes,
    total: totalTypes
  }),
  (filteredNetwork) => ({
    size: summarizeSizes(filteredNetwork),
    transfer: summarizeTransfer(filteredNetwork)
  })
);

const castNetworkToTotalCoverage = (network) => objMap(
  splitNetworkByTypes(network, {
    js: jsTypes,
    css: cssTypes
  }),
  (filteredNetwork) => summarizeCoverage(filteredNetwork)
);

const getNetworkStats = (statsGetter, network) => {
  const { internal, external } = splitNetworkByLocation(network);

  return {
    internal: statsGetter(internal),
    external: statsGetter(external),
    total: statsGetter(network)
  };
};

const getResourcesStats = (network) => getNetworkStats(castNetworkToResources, network);

const getCoverageStats = (network) => getNetworkStats(castNetworkToTotalCoverage, network);

module.exports = {
  parseNetwork,
  getResourcesStats,
  getCoverageStats
};
