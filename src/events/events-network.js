const { findEventByName, filterEventsByName } = require('./events-helpers.js');

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

const prepareSeparatedNetwork = (separatedNetwork, internalTest) => separatedNetwork
  .map(({ request, response, data, finish }) => ({
      url: request.args.data.url,
      internal: internalTest(request.args.data.url),
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
      size: finish.args.data.decodedBodyLength,
      transfer: finish.args.data.encodedDataLength,
    })
  );

const getNetworkStats = (events, internalTest) => prepareSeparatedNetwork(
  separateNetworkEvents(
    filterNetworkEvents(events)
  ),
  internalTest
);

const imagesTypes = ['jpg', 'png', 'svg', 'ico', 'gif'];
const fontsTypes = ['woff', 'woff2', 'ttf', 'eot'];

const filterNetwork = (network, extensions) => network
  .filter(({ extension }) => extensions.includes(extension));

const summarizeSizes = (network) => network.reduce((acc, { size }) => acc + size, 0);
const summarizeTransfer = (network) => network.reduce((acc, { transfer }) => acc + transfer, 0);

const getResourcesStats = (rawNetwork) => {
  const assetsNetwork = filterNetwork(rawNetwork, ['js', 'css']);

  const internalAssetsNetwork = assetsNetwork.filter(({ internal }) => internal);
  const externalAssetsNetwork = assetsNetwork.filter(({ internal }) => !internal);

  const imagesNetwork = filterNetwork(rawNetwork, imagesTypes);
  const fontsNetwork = filterNetwork(rawNetwork, fontsTypes);

  const assetsSize = summarizeSizes(assetsNetwork);
  const encodedAssetsSize = summarizeTransfer(assetsNetwork);

  const internalAssetsSize = summarizeSizes(internalAssetsNetwork);
  const internalEncodedAssetsSize = summarizeTransfer(internalAssetsNetwork);

  const externalAssetsSize = summarizeSizes(externalAssetsNetwork);
  const externalEncodedAssetsSize = summarizeTransfer(externalAssetsNetwork);

  const imagesSize = summarizeSizes(imagesNetwork);
  const encodedImagesSize = summarizeTransfer(imagesNetwork);

  const fontsSize = summarizeSizes(fontsNetwork);
  const encodedFontsSize = summarizeTransfer(fontsNetwork);

  const totalSize = summarizeSizes(rawNetwork);
  const encodedTotalSize = summarizeTransfer(rawNetwork);

  return {
    totalSize,
    encodedTotalSize,
    imagesSize,
    encodedImagesSize,
    fontsSize,
    encodedFontsSize,
    assetsSize,
    encodedAssetsSize,
    internalAssetsSize,
    internalEncodedAssetsSize,
    externalAssetsSize,
    externalEncodedAssetsSize
  };
};

module.exports = {
  getNetworkStats,
  getResourcesStats
};
