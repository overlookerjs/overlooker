const { makeRule, urlJoin, makeInternalTest } = require('./../utils.js');
const { getProgressLogger } = require('./progress.js');

const serializeRule = (rule) => typeof rule === 'object' && rule !== null && !Array.isArray(rule) ? ({
  fn: 'return ' + rule.fn.toString(),
  args: rule.args
}) : rule

const serializeRequests = (requests) => ({
  merge: serializeRule(requests.merge),
  internalTest: serializeRule(requests.internalTest),
  ignore: serializeRule(requests.ignore)
});

const prepareConfig = ({
                         requests = {},
                         progress,
                         checkStatus,
                         host,
                         pages,
                         customMetrics = {},
                         headlessBrowser,
                         ...rest
                       }) => ({
  requests: serializeRequests(requests),
  count: 5,
  threads: 1,
  platform: 'desktop',
  browserArgs: [],
  firstEvent: 'requestStart',
  buildData: {},
  throttling: {
    network: 'Good3G',
    cpu: 2
  },
  debug: false,
  logger: async (...args) => console.log(...args),
  checkStatus: checkStatus || (() => true),
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
  isPlaywright: Boolean(headlessBrowser && headlessBrowser === 'playwright'),
  ...rest
});

const prepareRequestsConfig = (requests = {}, host, pages) => ({
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
});

module.exports = {
  prepareConfig,
  prepareRequestsConfig
};
