const { makeInternalTest, objMap, makeRule } = require('./../utils.js');
const { getAllStats } = require('../events');
const { aggregateProfiles } = require('../aggregation');

const prepareResult = (result, config, buildData, pages) => Object.entries(result)
  .reduce((acc, [pageName, pageData]) => {
    const isInternal = config.requests && config.request.internalTest ? (
      config.requests.internalTest
    ) : (
      makeInternalTest(pages[pageName])
    );

    acc[pageName] = aggregateProfiles(
      pageData.map((tracing) => getAllStats(tracing, isInternal)),
      buildData,
      config.requests ? config.requests.merge : null
    );

    return acc;
  }, {});

const prepareConfig = ({
                         requests,
                         count,
                         threads,
                         platform,
                         ...rest
                       }) => ({
  requests: objMap(requests, makeRule),
  count: count || 5,
  threads: threads || 1,
  platform: platform || 'desktop',
  ...rest
});

module.exports = {
  prepareConfig,
  prepareResult
};
