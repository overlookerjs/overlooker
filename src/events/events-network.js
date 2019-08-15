const mime = require('mime-types');
const { getExtension } = require('./../utils.js');
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
  .filter(({ finish, request }) => finish && request);

const prepareSeparatedNetwork = (separatedNetwork, evaluatingMap, internalTest) => separatedNetwork
  .map(({
          request,
          request: { args: { data: { url } } },
          response,
          data,
          finish
        }) => ({
      url,
      evaluating: evaluatingMap[url],
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

const parseNetwork = (events, evaluatingMap, internalTest) => prepareSeparatedNetwork(
  separateNetworkEvents(
    filterNetworkEvents(events)
  ),
  evaluatingMap,
  internalTest
);

const filterNetwork = (network, extensions) => network
  .filter(({ extension }) => extensions.includes(extension));

const summarizeSizes = (network) => network.reduce((acc, { size }) => acc + size, 0);
const summarizeTransfer = (network) => network.reduce((acc, { transfer }) => acc + transfer, 0);

const splitNetworkByTypes = (network, types) => Object.entries(types).reduce((acc, [key, filter]) => {
  const filteredNetwork = filter ? filterNetwork(network, filter) : network;

  acc[key] = {
    size: summarizeSizes(filteredNetwork),
    transfer: summarizeTransfer(filteredNetwork)
  };

  return acc;
}, {});

const splitNetworkToResourcesTypes = (network) => {
  const stats = splitNetworkByTypes(network, {
    images: imagesTypes,
    fonts: fontsTypes,
    js: jsTypes,
    css: cssTypes,
    html: htmlTypes,
    total: totalTypes
  });

  stats.other = stats.total - (
    stats.images +
    stats.fonts +
    stats.js +
    stats.css +
    stats.html
  );

  return stats;
};

const getResourcesStats = (network) => {
  const internalNetwork = network.filter(({ internal }) => internal);
  const externalNetwork = network.filter(({ internal }) => !internal);

  return {
    internal: splitNetworkToResourcesTypes(internalNetwork),
    external: splitNetworkToResourcesTypes(externalNetwork),
    total: splitNetworkToResourcesTypes(network)
  };
};

module.exports = {
  parseNetwork,
  getResourcesStats
};
