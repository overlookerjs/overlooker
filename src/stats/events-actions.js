const { makeCoverageMap } = require('./events-coverage.js');
const { parseNetwork, getResourcesStats, getCoverageStats } = require('./events-network.js');
const { makeEventsRelative, findEventByName } = require('./events-helpers.js');
const { getCustomMetrics } = require('./events-custom.js');
const { map } = require('./../objects-utils');
const {
  getScriptsEvaluation,
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

    const rawEvaluation = getScriptsEvaluation(relativeEvents);
    const evaluationMap = makeScriptsEvaluationMap(rawEvaluation);
    const coverageMap = makeCoverageMap(coverage);
    const network = parseNetwork(relativeEvents, evaluationMap, coverageMap, internalTest); // ToDo: add coverage from page loading

    const evaluationStats = getScriptsEvaluationStats(rawEvaluation, internalTest);
    const resourcesStats = getResourcesStats(network);
    const coverageStats = getCoverageStats(network);

    const timings = getActionsTimings(relativeEvents);
    const custom = getCustomMetrics(relativeEvents, customMetrics);

    const userCentric = {
      elementsTimings: prepareElementsTimings(elementsTimings, navigationStartDelta),
      layersPaints: prepareLayersPaints(layersPaints, actionStart)
    };

    return {
      stats: {
        timings,
        custom,
        userCentric,
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
