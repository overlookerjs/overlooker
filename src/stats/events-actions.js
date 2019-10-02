const { parseNetwork, getResourcesStats, getCoverageStats } = require('./events-network.js');
const { makeEventsRelative, findEventByName } = require('./events-helpers.js');
const { objMap } = require('./../objects-utils');
const {
  getScriptsEvaluating,
  makeScriptsEvaluatingMap,
  getScriptsEvaluatingStats
} = require('./events-evaluating.js');

const getActionStart = (events) => findEventByName(events, 'action_start');

const getActionsTimings = (events) => {
  const start = findEventByName(events, 'action_start');
  const end = findEventByName(events, 'action_end');

  return {
    start: start.ts,
    end: end.ts
  };
};

const getActionsStats = (actions, internalTest) => objMap(
  actions,
  ({ tracing, coverage }, name) => {
    const actionStart = getActionStart(tracing);
    const relativeEvents = makeEventsRelative(tracing, actionStart);

    const rawEvaluating = getScriptsEvaluating(relativeEvents);
    const evaluatingMap = makeScriptsEvaluatingMap(rawEvaluating);
    const network = parseNetwork(relativeEvents, evaluatingMap, internalTest);

    const evaluatingStats = getScriptsEvaluatingStats(rawEvaluating, internalTest);
    const resourcesStats = getResourcesStats(network);
    const coverageStats = getCoverageStats(network);

    const timings = getActionsTimings(relativeEvents);

    return [
      name, {
        stats: {
          timings,
          evaluating: evaluatingStats,
          resources: resourcesStats,
          coverage: coverageStats
        },
        network,
        coverage
      }
    ]
  });

module.exports = {
  getActionsStats
};
