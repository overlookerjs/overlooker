const { parseNetwork, getResourcesStats } = require('./events-network.js');
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
    .map(([name, data]) => {
      const actionStart = getActionStart(data);
      const relativeEvents = makeEventsRelative(data, actionStart);

      const rawEvaluating = getScriptsEvaluating(relativeEvents);
      const evaluating = getScriptsEvaluatingStats(rawEvaluating, internalTest);
      const evaluatingMap = makeScriptsEvaluatingMap(rawEvaluating);

      const network = parseNetwork(relativeEvents, evaluatingMap, internalTest);
      const resources = getResourcesStats(network);
      const timings = getActionsTimings(relativeEvents);

      return [
        name, {
          stats: {
            resources,
            timings,
            evaluating
          },
          evaluating: evaluatingMap,
          network
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
