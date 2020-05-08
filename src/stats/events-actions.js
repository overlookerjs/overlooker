const { getEventsTreeByThreads } = require('./events-tree.js');
const { makeCoverageMap } = require('./events-coverage.js');
const { parseNetwork, getResourcesStats, getCoverageStats } = require('./events-network.js');
const { makeEventsRelative, findEventByName } = require('./events-helpers.js');
const { getCustomMetrics } = require('./events-custom.js');
const { map } = require('./../objects-utils');
const {
  prepareEvaluations,
  getMeaningEvaluationEvents,
  makeScriptsEvaluationMap,
  getScriptsEvaluationStats
} = require('./events-evaluation.js');
const { prepareElementsTimings, prepareLayersPaints } = require('./events-user-centric.js');
const { ACTION_START, ACTION_END } = require('./../constants.js');

const getActionStart = (events) => findEventByName(events, ACTION_START);

const getActionsTimings = (events) => {
  const start = findEventByName(events, ACTION_START);
  const end = findEventByName(events, ACTION_END);

  return {
    start: start.ts,
    end: end.ts
  };
};

const getActionsStats = (actions, navigationStart, config) => map(
  actions,
  ({ tracing, coverage, elementsTimings, layersPaints }) => {
    const { requests: { internalTest }, customMetrics } = config;

    const actionStart = getActionStart(tracing);

    const relativeEvents = makeEventsRelative(tracing, actionStart);
    const navigationStartDelta = navigationStart.ts - actionStart.ts;

    const mainEvents = getEventsTreeByThreads(makeEventsRelative(tracing, actionStart)).find(({ name }) => name === 'main').events;
    const meaningfulEvaluations = getMeaningEvaluationEvents(mainEvents);
    const extractEvaluationValues = prepareEvaluations(meaningfulEvaluations);

    const evaluationMap = makeScriptsEvaluationMap(extractEvaluationValues.filter(({ url }) => url));
    const coverageMap = makeCoverageMap(coverage);
    const network = parseNetwork(relativeEvents, evaluationMap, coverageMap, internalTest); // ToDo: add coverage from page loading

    const evaluationStats = getScriptsEvaluationStats(extractEvaluationValues, internalTest);
    const resourcesStats = getResourcesStats(network);
    const coverageStats = getCoverageStats(network);

    const timings = getActionsTimings(relativeEvents);
    const custom = getCustomMetrics(relativeEvents, customMetrics);

    const elementsTimingsStats = prepareElementsTimings(elementsTimings, navigationStartDelta);
    const layersPaintsStats = prepareLayersPaints(layersPaints, actionStart);

    return {
      stats: {
        timings,
        custom,
        elementsTimings: elementsTimingsStats,
        layersPaints: layersPaintsStats,
        evaluation: evaluationStats,
        resources: resourcesStats,
        coverage: coverageStats
      },
      network,
      coverage
    };
  });

module.exports = {
  getActionsStats
};
