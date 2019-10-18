const { makeInternalTest, makeRule } = require('./../utils.js');
const { objMap, asyncObjMap } = require('./../objects-utils.js');
const { getAllStats } = require('../stats');
const { aggregateProfiles } = require('../aggregation');

const prepareResult = async (result, config, buildData) => (
  asyncObjMap(
    result,
    async (pageData, pageName) => {
      const isInternal = config.requests && config.requests.internalTest ? (
        config.requests.internalTest
      ) : (
        makeInternalTest(config.pages.find(({ name }) => pageName === name).url)
      );

      const stats = await Promise.all(
        pageData.map((data) => getAllStats(data, isInternal, config.firstEvent))
      );

      return aggregateProfiles(
        stats,
        buildData,
        config.requests ? config.requests.merge : null
      )
    })
);

const prepareConfig = ({
                         requests,
                         ...rest
                       }) => ({
  requests: objMap(requests, makeRule),
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
