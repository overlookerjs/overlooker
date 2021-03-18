const { getEventsGroups, getEventsTree } = require('./events-tree.js');
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
const { getLighthouseScore } = require('./lighthouse-score');
const { getActionsStats } = require('./events-actions.js');
const { getCustomMetrics } = require('./events-custom.js');
const { makeCoverageMap } = require('./events-coverage.js');
const {
  getScriptsEvaluationStats,
  makeScriptsEvaluationMap,
  getMeaningEvaluationEvents,
  prepareEvaluations
} = require('./events-evaluation.js');
const { getScreenshotsByMetrics } = require('./events-screenshots.js');
const { flat } = require('./../objects-utils.js');
const { getBriefTracing, processTracingTree } = require('./events-brief-tracing.js');

const getAllStats = async ({
                             tracing,
                             coverage,
                             actions,
                             timeToInteractive,
                             elementsTimings,
                             layersPaints
                           }, config) => {
  const { requests: { internalTest }, firstEvent: firstEventName, customMetrics, platform } = config;

  const firstEvent = getEventInMainFrame(tracing, firstEventName) || getEventInMainFrame(tracing, 'responseEnd');
  const navigationStart = getEventInMainFrame(tracing, 'navigationStart');
  const navigationStartDelta = navigationStart.ts - firstEvent.ts;

  const mainFrame = firstEvent.args.frame;
  const relativeEvents = makeEventsRelative(tracing, firstEvent);

  const eventsGroups = getEventsGroups(relativeEvents);
  const mainEvents = eventsGroups.find(({ name }) => name === 'Main').events;
  const otherEvents = eventsGroups.find(({ name }) => name === 'Other').events;
  const mainEventsTree = processTracingTree(getEventsTree(mainEvents));

  const meaningfulEvaluations = getMeaningEvaluationEvents(mainEventsTree);
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
  const totalBlockingTime = getTotalBlockingTime(mainEventsTree, timeToInteractive, timings.firstContentfulPaint);
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

  const flattedTimestamps = Object.entries(flat({
    timings,
    userCentric: {
      timeToInteractive
    },
    elementsTimings: elementsTimingsStats,
    layersPaints: layersPaintsStats
  })).map(([name, value]) => ({ name, value }));

  const screenshots = getScreenshotsByMetrics(relativeEvents, flattedTimestamps);
  const briefTracing = await getBriefTracing(mainEvents, otherEvents, firstEvent, config);

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
    screenshots,
    tracing: {
      data: briefTracing,
      marks: flattedTimestamps
    },
    actions: actionsStats
  }
};

module.exports = {
  getAllStats
};
