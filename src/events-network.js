const { findEventByName, filterEventsByName } = require('./events-helpers.js');

const filterNetworkEvents = filterEventsByName([
  'ResourceSendRequest',
  'ResourceReceivedData',
  'ResourceReceiveResponse',
  'ResourceFinish'
]);

const separateNetworkEvents = (networkEvents) => Object.values(networkEvents)
  .map((items) => ({
    request: findEventByName(items, 'ResourceSendRequest'),
    response: findEventByName(items, 'ResourceReceiveResponse'),
    data: filterEventsByName(items, 'ResourceReceivedData'),
    finish: findEventByName(items, 'ResourceReceiveResponse')
  }))
  .filter(({ finish, request }) => finish && request);

const prepareSeparatedNetwork = (separatedNetwork) => separatedNetwork
  .map(({ request, response, data, finish }) => ({
      url: request.args.data.url,
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

const getNetworkStats = (events) => prepareSeparatedNetwork(separateNetworkEvents(filterNetworkEvents(events)));

module.exports = {
  getNetworkStats
};
