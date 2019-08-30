const { makeInternalTest, makeRule } = require('./../utils.js');
const { objMap } = require('./../objects-utils.js');
const { getAllStats } = require('../events');
const { aggregateProfiles } = require('../aggregation');

const prepareResult = async (result, config, buildData) => {
  const pagesStats = await Promise.all(
    Object.entries(result)
      .map(async ([pageName, pageData]) => {
        const isInternal = config.requests && config.request.internalTest ? (
          config.requests.internalTest
        ) : (
          makeInternalTest(config.pages.find(({ name }) => pageName === name).url)
        );

        return [
          pageName,
          await Promise.all(pageData.map((data) => getAllStats(data, isInternal, config.firstEvent)))
        ];
      })
  );

  return pagesStats.reduce((acc, [pageName, pageStatsArray]) => {
    acc[pageName] = aggregateProfiles(
      pageStatsArray,
      buildData,
      config.requests ? config.requests.merge : null
    );

    return acc;
  }, {});
};

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
  logger: async (...args) => console.log(...args),
  ...rest
});

module.exports = {
  prepareConfig,
  prepareResult
};
