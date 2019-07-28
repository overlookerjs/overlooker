const { makeEventsRelative } = require('./events-helpers.js');
const { getMainFetchStart, getMainEventsTimestamps } = require('./events-main.js');
const { parseNetwork, getResourcesStats } = require('./events-network.js');
const { getScriptsEvaluating, getScriptsEvaluatingStats, makeScriptsEvaluatingMap } = require('./events-evaluating.js');

const getAllStats = (events, internalTest) => {
  const fetchStart = getMainFetchStart(events);
  const mainFrame = fetchStart.args.frame;
  const relativeEvents = makeEventsRelative(events, fetchStart);

  const rawEvaluating = getScriptsEvaluating(relativeEvents);
  const evaluating = getScriptsEvaluatingStats(rawEvaluating, internalTest);
  const evaluatingMap = makeScriptsEvaluatingMap(rawEvaluating);

  const network = parseNetwork(relativeEvents, evaluatingMap, internalTest);
  const resources = getResourcesStats(network);
  const timings = getMainEventsTimestamps(relativeEvents, mainFrame);

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
