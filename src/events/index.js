const { makeEventsRelative } = require('./events-helpers.js');
const { getFetchStart, getMainEventsTimestamps } = require('./events-main.js');
const { parseNetwork, getResourcesStats } = require('./events-network.js');
const { getScriptsEvaluating, getScriptsEvaluatingStats, makeScriptsEvaluatingMap } = require('./events-evaluating.js');

const getAllStats = (events, internalTest) => {
  const fetchStart = getFetchStart(events);
  const relativeEvents = makeEventsRelative(events, fetchStart);

  const timings = getMainEventsTimestamps(relativeEvents);
  const network = parseNetwork(relativeEvents, internalTest);
  const resources = getResourcesStats(network);
  const rawEvaluating = getScriptsEvaluating(relativeEvents);
  const evaluatingMap = makeScriptsEvaluatingMap(rawEvaluating);
  const evaluating = getScriptsEvaluatingStats(rawEvaluating, internalTest);

  return {
    stats: {
      resources,
      timings,
      evaluating
    },
    evaluating: evaluatingMap,
    network
  }
};

module.exports = {
  getAllStats
};
