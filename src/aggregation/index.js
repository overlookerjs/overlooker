const { concatNetworks, aggregateNetwork } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { deepConcat } = require('./../objects-utils.js');
const { objDeepAggregation } = require('./aggregation-utils.js');
const { concatActions, aggregateActions } = require('./aggregation-actions.js');
const { aggregateScreenshots } = require('./aggregation-screenshots.js');

const aggregateProfiles = (profiles,
                           buildData,
                           mergeRequests,
                           aggregation = objDeepAggregation) => {
  const { stats, network, actions, screenshots } = profiles.reduce((summary, profile) => ({
    stats: deepConcat(profile.stats, summary.stats),
    network: concatNetworks(profile.network, summary.network, mergeRequests),
    actions: concatActions(profile.actions, summary.actions, mergeRequests),
    screenshots: profile.screenshots ? [
      ...summary.screenshots,
      {
        ...profile.screenshots,
        weight: profile.stats.userCentric.lighthouseScore,
        weightType: 'lighthouseScore'
      }
    ] : null
  }), {
    stats: {},
    network: {},
    actions: {},
    screenshots: []
  });

  return {
    stats: aggregation(stats),
    network: expandNetwork(aggregateNetwork(aggregation, network), buildData),
    actions: aggregateActions(actions, buildData, mergeRequests, aggregation),
    screenshots: screenshots ? aggregateScreenshots(screenshots) : null
  };
};

module.exports = {
  aggregateProfiles
};
