const { makeEventsRelative } = require('./events-helpers.js');
const { getEventInMainFrame, getMainEventsTimestamps } = require('./events-main.js');
const { parseNetwork, getResourcesStats, getCoverageStats } = require('./events-network.js');
const { getSpeedIndex, getHeroElementsPaints } = require('./events-user-centric.js');
const { getActionsStats } = require('./events-actions.js');
const { getCustomMetrics } = require('./events-custom.js');
const { makeCoverageMap } = require('./events-coverage.js');
const {
  getScriptsEvaluation,
  getScriptsEvaluationStats,
  makeScriptsEvaluationMap
} = require('./events-evaluation.js');

const getAllStats = async ({ tracing, coverage, actions, heroElementsPaints }, internalTest, firstEventName) => {
  const firstEvent = getEventInMainFrame(tracing, firstEventName);
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
  const custom = getCustomMetrics(relativeEvents);

  const userCentric = {
    speedIndex: await getSpeedIndex(tracing),
    heroElements: getHeroElementsPaints(
      map(
        heroElementsPaints,
        (heroElementPaints) => makeEventsRelative(heroElementPaints, firstEvent)
      )
    )
  };

  const actionsStats = getActionsStats(actions, internalTest);

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
