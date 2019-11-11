const { makeCoverageMap } = require("./events-coverage.js");
const { parseNetwork, getResourcesStats, getCoverageStats } = require('./events-network.js');
const { makeEventsRelative, findEventByName } = require('./events-helpers.js');
const { getCustomMetrics } = require('./events-custom.js');
const { map } = require('./../objects-utils');
const {
  getScriptsEvaluating,
  makeScriptsEvaluatingMap,
  getScriptsEvaluatingStats
} = require('./events-evaluating.js');
const { ACTION_START, ACTION_END } = require('./../constants.js');

const getActionStart = (events) => findEventByName(events, ACTION_START);

const getActionsTimings = (events) => {
  const start = findEventByName(events, ACTION_START);
  const end = findEventByName(events, ACTION_END);

  return {
    start: start.ts,
    end: end.ts
  };
};

const getActionsStats = (actions, internalTest) => map(
  actions,
  ({ tracing, coverage }) => {
    const actionStart = getActionStart(tracing);
    const relativeEvents = makeEventsRelative(tracing, actionStart);

    const rawEvaluating = getScriptsEvaluating(relativeEvents);
    const evaluatingMap = makeScriptsEvaluatingMap(rawEvaluating);
    const coverageMap = makeCoverageMap(coverage);
    const network = parseNetwork(relativeEvents, evaluatingMap, coverageMap, internalTest); // ToDo: add coverage from page loading

    const evaluatingStats = getScriptsEvaluatingStats(rawEvaluating, internalTest);
    const resourcesStats = getResourcesStats(network);
    const coverageStats = getCoverageStats(network);

    const timings = getActionsTimings(relativeEvents);
    const custom = getCustomMetrics(relativeEvents);

    return {
      stats: {
        timings,
        custom,
        evaluating: evaluatingStats,
        resources: resourcesStats,
        coverage: coverageStats
      },
      network,
      coverage
    };
  });

module.exports = {
  getActionsStats
};
