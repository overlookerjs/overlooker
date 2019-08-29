const { makeEventsRelative } = require('./events-helpers.js');
const { getEventInMainFrame, getMainEventsTimestamps } = require('./events-main.js');
const { parseNetwork, getResourcesStats } = require('./events-network.js');
const { getSpeedIndex, getHeroElementPaints } = require('./events-user-centric.js');
const { getActionsStats } = require('./events-actions.js');
const {
  getScriptsEvaluating,
  getScriptsEvaluatingStats,
  makeScriptsEvaluatingMap
} = require('./events-evaluating.js');

const getAllStats = async ({ main, actions, heroElementPaints }, internalTest, firstEventName) => {
  const firstEvent = getEventInMainFrame(main, firstEventName);
  const mainFrame = firstEvent.args.frame;
  const relativeEvents = makeEventsRelative(main, firstEvent);

  const rawEvaluating = getScriptsEvaluating(relativeEvents);
  const evaluating = getScriptsEvaluatingStats(rawEvaluating, internalTest);
  const evaluatingMap = makeScriptsEvaluatingMap(rawEvaluating);

  const network = parseNetwork(relativeEvents, evaluatingMap, internalTest);
  const resources = getResourcesStats(network);
  const timings = getMainEventsTimestamps(relativeEvents, mainFrame);

  const userCentric = {
    speedIndex: await getSpeedIndex(main),
    ...getHeroElementPaints(makeEventsRelative(heroElementPaints, firstEvent))
  };

  const actionsStats = getActionsStats(actions, internalTest);

  return {
    stats: {
      resources,
      timings,
      evaluating,
      userCentric
    },
    network,
    actions: actionsStats
  }
};

module.exports = {
  getAllStats
};
