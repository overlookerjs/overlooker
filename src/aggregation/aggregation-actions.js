const { getNetworkSummary, normalizeNetworkSummary } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { objConcat, objMap } = require('./../objects-utils.js');
const { objAggregation } = require('./aggregation-utils.js');

const getActionsSummary = (actions, summary, mergeRequests) => (
  objMap(actions, (action, name) => ({
    stats: objMap(action.stats, (innerObj, key) => objConcat(
      innerObj,
      summary.actions[name] ? summary.actions[name].stats[key] : {}
    )),
    network: getNetworkSummary(
      action.network,
      summary.actions[name] ? summary.actions[name].network : {},
      mergeRequests
    )
  }))
);

const normalizeActionsSummary = (actions, buildData) => objMap(actions, (action) => ({
  stats: objMap(action.stats, (innerObj) => objAggregation(innerObj)),
  network: expandNetwork(normalizeNetworkSummary(action.network), buildData),
}));

module.exports = {
  getActionsSummary,
  normalizeActionsSummary
};
