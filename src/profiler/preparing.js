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
          await Promise.all(pageData.map((data) => getAllStats(data, isInternal)))
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
                         count,
                         threads,
                         platform,
                         browserArgs,
                         ...rest
                       }) => ({
  requests: objMap(requests, makeRule),
  count: count || 5,
  threads: threads || 1,
  platform: platform || 'desktop',
  browserArgs: browserArgs || [],
  ...rest
});

module.exports = {
  prepareConfig,
  prepareResult
};