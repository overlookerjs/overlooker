const { makeRule } = require('./../utils.js');
const { map } = require('./../objects-utils.js');
const { aggregateProfiles } = require('../aggregation');

const prepareResult = async (result, config, buildData) => (
  map(
    result,
    (stats) => aggregateProfiles(
      stats,
      buildData,
      config.requests ? config.requests.merge : null
    )
  )
);

const prepareConfig = ({
                         requests,
                         ...rest
                       }) => ({
  requests: map(requests, makeRule),
  count: 5,
  threads: 1,
  platform: 'desktop',
  browserArgs: [],
  firstEvent: 'responseEnd',
  buildData: {},
  throttling: {
    network: 'Good3G',
    cpu: 2
  },
  debug: false,
  logger: async (...args) => console.log(...args),
  ...rest
});

module.exports = {
  prepareConfig,
  prepareResult
};
