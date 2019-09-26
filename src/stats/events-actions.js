const { parseNetwork, getResourcesStats, getCoverageStats } = require('./events-network.js');
const { makeEventsRelative } = require('./events-helpers.js');
const { findEventByName } = require('./events-helpers.js');
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

const getActionsStats = (actions, internalTest) => (
  Object.entries(actions)
    .map(([name, { tracing, coverage }]) => {
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
          evaluating: evaluatingMap,
          network,
          coverage
        }
      ]
    })
    .reduce((acc, [name, data]) => {
      acc[name] = data;

      return acc;
    }, {})
);

module.exports = {
  getActionsStats
};
