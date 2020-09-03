const { makeRule, urlJoin, makeInternalTest } = require('./../utils.js');
const { map } = require('./../objects-utils.js');
const { aggregateProfiles } = require('../aggregation');
const { getProgressLogger } = require('./progress.js');

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
                         requests = {},
                         progress,
                         host,
                         pages,
                         customMetrics = {},
                         ...rest
                       }) => ({
  requests: {
    merge: requests.merge && makeRule(requests.merge, true),
    internalTest: requests.internalTest ? (
      makeRule(requests.internalTest)
    ) : (
      host ? (
        makeInternalTest(host)
      ) : (
        makeRule(pages.map(({ url }) => makeInternalTest(url)))
      )
    ),
    ignore: requests.ignore && makeRule(requests.ignore)
  },
  count: 5,
  threads: 1,
  platform: 'desktop',
  browserArgs: [],
  firstEvent: 'responseStart',
  buildData: {},
  throttling: {
    network: 'Good3G',
    cpu: 2
  },
  debug: false,
  logger: async (...args) => console.log(...args),
  progress: getProgressLogger(progress),
  gracefulShutdown: true,
  customMetrics: {
    timing: /^overlooker\.metrics\.timing:(.*?)$/i,
    durationStart: /^overlooker\.metrics\.duration\.start:(.*?)(?:#(.*?))?$/i,
    durationEnd: /^overlooker\.metrics\.duration\.end:(.*?)(?:#(.*?))?$/i,
    ...customMetrics
  },
  ...({
    pages: host ? pages.map((page) => ({
      ...page,
      url: urlJoin(host, page.url)
    })) : pages
  }),
  ...rest
});

module.exports = {
  prepareConfig,
  prepareResult
};
