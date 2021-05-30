const { concatNetworks, aggregateNetwork } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { deepConcat, map } = require('./../objects-utils.js');
const { objDeepAggregation } = require('./aggregation-utils.js');
const { concatActions, aggregateActions } = require('./aggregation-actions.js');
const { aggregateWeighted } = require('./aggregation-weighted.js');
const { concatWithWeight } = require('./aggregation-utils.js');

const aggregateProfilesSeries = (profiles,
                           buildData,
                           mergeRequests,
                           aggregation = objDeepAggregation) => {
  const concatWithLighthouseScore = concatWithWeight('lighthouseScore');

  const { stats, network, actions, screenshots, tracing } = profiles.reduce((summary, profile) => ({
    stats: deepConcat(profile.stats, summary.stats),
    network: concatNetworks(profile.network, summary.network, mergeRequests),
    actions: concatActions(profile.actions, summary.actions, mergeRequests),
    screenshots: concatWithLighthouseScore(
      profile.stats.userCentric.lighthouseScore,
      profile.screenshots,
      summary.screenshots
    ),
    tracing: concatWithLighthouseScore(
      profile.stats.userCentric.lighthouseScore,
      profile.tracing,
      summary.tracing
    )
  }), {
    stats: {},
    network: {},
    actions: {},
    screenshots: [],
    tracing: []
  });

  return {
    stats: aggregation(stats),
    network: expandNetwork(aggregateNetwork(aggregation, network), buildData),
    actions: aggregateActions(actions, buildData, mergeRequests, aggregation),
    screenshots: screenshots ? aggregateWeighted(screenshots) : null,
    tracing: tracing ? aggregateWeighted(tracing) : null
  };
};

const aggregateProfiles = async (result, config, buildData) => (
  map(
    result,
    (stats) => aggregateProfilesSeries(
      stats,
      buildData,
      config.requests ? config.requests.merge : null
    )
  )
);

module.exports = {
  aggregateProfiles,
  aggregateProfilesSeries
};
