const { makeEventsRelative, getEventsTimestamps } = require('./events-helpers.js');
const { getFetchStart, getMainEventsTimestamps } = require('./events-main.js');
const { getNetworkStats } = require('./events-network.js');
const { getScriptsEvaluating } = require('./events-evaluating.js');

const getAllStats = (events) => {
  const fetchStart = getFetchStart(events);
  const relativeEvents = makeEventsRelative(events, fetchStart);

  const timings = getMainEventsTimestamps(relativeEvents);
  const network = getNetworkStats(relativeEvents);
  const evaluating = getScriptsEvaluating(relativeEvents);

  return {
    timings,
    network,
    evaluating
  }
};

module.exports = {
  getAllStats
};
