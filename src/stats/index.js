const { getEventsGroups, getEventsTree } = require('./events-tree.js');
const { makeEventsRelative, castMarkName } = require('./events-helpers.js');
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
const { getBriefTracing, getWaterfall, processTracingTree, gzip } = require('./events-brief-tracing.js');

const getAllStats = async ({
                             tracing,
                             coverage,
                             actions,
                             timeToInteractive,
                             elementsTimings,
                             layersPaints,
                             cacheLog
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
  }))

  const screenshots = getScreenshotsByMetrics(
    relativeEvents,
    flattedTimestamps.map(([name, value]) => ({ name, value }))
  );

  let flameChartData;

  if (config.tracing) {
    const data = await getBriefTracing(mainEvents, otherEvents, firstEvent);

    const timeDelta = cacheLog ? (
      cacheLog[0].requestStart - (
        tracing.find(({
                        name,
                        args
                      }) => (
          name === 'ResourceSendRequest' && args && args.data && args.data.url === cacheLog[0].name
        )).ts - firstEvent.ts
      ) / 1000
    ) : 0;

    const waterfall = getWaterfall(network, cacheLog, timeDelta);

    const marks = flattedTimestamps
      .map(([fullName, timestamp]) => {
        const markInfo = castMarkName(fullName);

        if (markInfo) {
          return {
            fullName,
            timestamp: timestamp / 1000,
            ...markInfo
          }
        } else {
          return null;
        }
      })
      .filter(Boolean);

    flameChartData = {
      data,
      waterfall,
      marks
    };

    if (config.tracing === 'gzip') {
      flameChartData = await gzip(flameChartData);
    }
  }

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
    tracing: flameChartData,
    actions: actionsStats
  }
};

module.exports = {
  getAllStats
};
