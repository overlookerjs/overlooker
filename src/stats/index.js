const { makeEventsRelative } = require('./events-helpers.js');
const { getEventInMainFrame, getMainEventsTimestamps } = require('./events-main.js');
const { parseNetwork, getResourcesStats, getCoverageStats } = require('./events-network.js');
const { getSpeedIndex, getHeroElementPaints } = require('./events-user-centric.js');
const { getActionsStats } = require('./events-actions.js');
const { makeCoverageMap } = require('./events-coverage.js');
const {
  getScriptsEvaluating,
  getScriptsEvaluatingStats,
  makeScriptsEvaluatingMap
} = require('./events-evaluating.js');

const getAllStats = async ({ tracing, coverage, actions, heroElementPaints }, internalTest, firstEventName) => {
  const firstEvent = getEventInMainFrame(tracing, firstEventName);
  const mainFrame = firstEvent.args.frame;
  const relativeEvents = makeEventsRelative(tracing, firstEvent);

  const rawEvaluating = getScriptsEvaluating(relativeEvents);
  const evaluatingMap = makeScriptsEvaluatingMap(rawEvaluating);
  const coverageMap = makeCoverageMap(coverage);

  const network = parseNetwork(relativeEvents, evaluatingMap, coverageMap, internalTest);

  const resourcesStats = getResourcesStats(network);
  const evaluatingStats = getScriptsEvaluatingStats(rawEvaluating, internalTest);
  const coverageStats = getCoverageStats(network);

  const timings = getMainEventsTimestamps(relativeEvents, mainFrame);

  const userCentric = {
    speedIndex: await getSpeedIndex(tracing),
    ...getHeroElementPaints(makeEventsRelative(heroElementPaints, firstEvent))
  };

  const actionsStats = getActionsStats(actions, internalTest);

  return {
    stats: {
      timings,
      userCentric,
      evaluating: evaluatingStats,
      resources: resourcesStats,
      coverage: coverageStats
    },
    network,
    coverage,
    actions: actionsStats
  }
};

module.exports = {
  getAllStats
};
