const { asyncMap } = require('./../objects-utils.js');
const path = require('path');

const findNodePaintEvents = (events, node) => (
  events.filter(({ name, args }) => (
    (
      name === 'PaintImage' || name === 'Paint'
    ) && args.data && args.data.nodeId && (
      node.backendNodeId === args.data.nodeId
    )
  ))
);

const getPaintEventsBySelector = async (client, events, selector) => {
  if (selector) {
    try {
      const { root: { nodeId: rootNodeId } } = await client.send('DOM.getDocument');

      const { nodeId } = await client.send('DOM.querySelector', {
        nodeId: rootNodeId,
        selector
      });

      if (nodeId) {
        const node = await client.send('DOM.describeNode', { nodeId }).then(({ node }) => node);

        return node ? findNodePaintEvents(events, node) : [];
      } else {
        return [];
      }
    } catch (err) {
      return [];
    }
  }

  return [];
};

const getPaintEventsBySelectors = async (client, events, selectors = {}) => (
  asyncMap(selectors, (selector) => getPaintEventsBySelector(client, events, selector))
);

const runElementTimingObserver = () => {
  if (!window.oet) {
    window.oet = [];

    new PerformanceObserver(function(list) {
      window.oet.push(...list.getEntries());
      console.log('timings elem', list.getEntries());
    }).observe({ entryTypes: ['element'] });
  }
};

const injectElementTimingObserver = async (page) => {
  /* istanbul ignore next */
  await page.evaluateOnNewDocument(runElementTimingObserver);
};

const injectElementTimingHandler = async (page) => {
  await page.addScriptTag({ path: require.resolve('overlooker-element-timing/dist/index.min.js') });
};

const getElementsTimings = async (page) => {
  /* istanbul ignore next */
  return await page.evaluate(() => {
    const timingEntries = window.oet.getAll();

    window.oet.clear();

    return timingEntries;
  });
};

module.exports = {
  getPaintEventsBySelectors,
  injectElementTimingObserver,
  injectElementTimingHandler,
  getElementsTimings
};
