const { makeEventsRelative } = require('./events-helpers.js');
const { getEventInMainFrame, getMainEventsTimestamps } = require('./events-main.js');
const { parseNetwork, getResourcesStats, getCoverageStats } = require('./events-network.js');
const { getSpeedIndex, prepareElementsTimings } = require('./events-user-centric.js');
const { getActionsStats } = require('./events-actions.js');
const { getCustomMetrics } = require('./events-custom.js');
const { makeCoverageMap } = require('./events-coverage.js');
const {
  getScriptsEvaluation,
  getScriptsEvaluationStats,
  makeScriptsEvaluationMap
} = require('./events-evaluation.js');

const getAllStats = async ({ tracing, coverage, actions, timeToInteractive, elementsTimings }, config) => {
  const { requests: { internalTest }, firstEvent: firstEventName, customMetrics } = config;

  const firstEvent = getEventInMainFrame(tracing, firstEventName);
  const navigationStart = getEventInMainFrame(tracing, 'navigationStart');
  const navigationStartDelta = navigationStart.ts - firstEvent.ts;

  const mainFrame = firstEvent.args.frame;
  const relativeEvents = makeEventsRelative(tracing, firstEvent);

  const rawEvaluation = getScriptsEvaluation(relativeEvents);
  const evaluationMap = makeScriptsEvaluationMap(rawEvaluation);
  const coverageMap = makeCoverageMap(coverage);

  const network = parseNetwork(relativeEvents, evaluationMap, coverageMap, internalTest);

  const resourcesStats = getResourcesStats(network);
  const evaluationStats = getScriptsEvaluationStats(rawEvaluation, internalTest);
  const coverageStats = getCoverageStats(network);

  const timings = getMainEventsTimestamps(relativeEvents, mainFrame);
  const custom = getCustomMetrics(relativeEvents, customMetrics);

  const userCentric = {
    speedIndex: await getSpeedIndex(tracing),
    elementsTimings: prepareElementsTimings(elementsTimings, navigationStartDelta),
    timeToInteractive
  };

  const actionsStats = getActionsStats(actions, config);

  return {
    stats: {
      timings,
      userCentric,
      custom,
      evaluation: evaluationStats,
      resources: resourcesStats,
      coverage: coverageStats,
    },
    network,
    coverage,
    actions: actionsStats
  }
};

module.exports = {
  getAllStats
};
