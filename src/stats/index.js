const { getEventsTreeByThreads } = require('./events-tree.js');
const { makeEventsRelative } = require('./events-helpers.js');
const { getEventInMainFrame, getMainEventsTimestamps } = require('./events-main.js');
const { parseNetwork, getResourcesStats, getCoverageStats } = require('./events-network.js');
const { 
  getSpeedIndex, 
  prepareElementsTimings, 
  prepareLayersPaints, 
  getCumulativeLayoutShift, 
  getTotalBlockingTime
} = require('./events-user-centric.js');
const { getLighthouseScore } = require ('./lighthouseScore');
const { getActionsStats } = require('./events-actions.js');
const { getCustomMetrics } = require('./events-custom.js');
const { makeCoverageMap } = require('./events-coverage.js');
const {
  getScriptsEvaluationStats,
  makeScriptsEvaluationMap,
  getMeaningEvaluationEvents,
  prepareEvaluations
} = require('./events-evaluation.js');

const getAllStats = async ({ tracing, coverage, actions, timeToInteractive, elementsTimings, layersPaints }, config) => {
  const { requests: { internalTest }, firstEvent: firstEventName, customMetrics, platform } = config;

  const firstEvent = getEventInMainFrame(tracing, firstEventName);
  const navigationStart = getEventInMainFrame(tracing, 'navigationStart');
  const navigationStartDelta = navigationStart.ts - firstEvent.ts;

  const mainFrame = firstEvent.args.frame;
  const relativeEvents = makeEventsRelative(tracing, firstEvent);

  const mainEvents = getEventsTreeByThreads(makeEventsRelative(tracing, firstEvent)).find(({ name }) => name === 'main').events;
  const meaningfulEvaluations = getMeaningEvaluationEvents(mainEvents);
  const extractEvaluationValues = prepareEvaluations(meaningfulEvaluations);

  const evaluationMap = makeScriptsEvaluationMap(extractEvaluationValues.filter(({ url }) => url));
  const coverageMap = makeCoverageMap(coverage);

  const network = parseNetwork(relativeEvents, evaluationMap, coverageMap, internalTest);

  const resourcesStats = getResourcesStats(network);
  const evaluationStats = getScriptsEvaluationStats(extractEvaluationValues, internalTest);
  const coverageStats = getCoverageStats(network);

  const timings = getMainEventsTimestamps(relativeEvents, mainFrame);
  const custom = getCustomMetrics(relativeEvents, customMetrics);
  const speedIndex = await getSpeedIndex(tracing);
  const totalBlockingTime = getTotalBlockingTime(mainEvents, timeToInteractive, timings.firstContentfulPaint);
  const cumulativeLayoutShift = getCumulativeLayoutShift(relativeEvents);

  const userCentric = {
    speedIndex,
    timeToInteractive,
    cumulativeLayoutShift,
    totalBlockingTime,
    lighthouseScore: getLighthouseScore({
      FCP: timings.firstContentfulPaint / 1000,
      SI: speedIndex / 1000,
      LCP: timings.largestContentfulPaint / 1000,
      TTI: timeToInteractive / 1000,
      TBT: totalBlockingTime / 1000,
      CLS: cumulativeLayoutShift,  
    }, platform)
  };

  const elementsTimingsStats = prepareElementsTimings(elementsTimings, navigationStartDelta);
  const layersPaintsStats = prepareLayersPaints(layersPaints, firstEvent);

  const actionsStats = getActionsStats(actions, navigationStart, config);

  return {
    stats: {
      timings,
      userCentric,
      custom,
      elementsTimings: elementsTimingsStats,
      layersPaints: layersPaintsStats,
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
