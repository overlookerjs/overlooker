const { asyncMap } = require('./../objects-utils.js');
const fs = require('fs');

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

const globalOETName = '__oet__';

const runElementTimingObserver = (oetPropName) => {
  if (!window[oetPropName]) {
    window[oetPropName] = [];

    new PerformanceObserver(function(list) {
      window[oetPropName].push(...list.getEntries());
    }).observe({ entryTypes: ['element'] });
  }
};

const injectElementTimingObserver = async (page) => {
  /* istanbul ignore next */
  await page.evaluateOnNewDocument(runElementTimingObserver, globalOETName);
};

const injectElementTimingHandler = async (page) => {
  await page.addScriptTag({
    type: 'module',
    content: `
      ${fs.readFileSync(require.resolve('overlooker-element-timing'))}
      
      if (!(window['${globalOETName}'] instanceof OverlookerElementTiming)) {
        new OverlookerElementTiming('${globalOETName}');
      }
  `
  });
};

const getElementsTimings = async (page) => {
  /* istanbul ignore next */
  return await page.evaluate((oetPropName) => {
    const timingEntries = window[oetPropName].getAll();

    window[oetPropName].clear();

    return timingEntries;
  }, globalOETName);
};

module.exports = {
  getPaintEventsBySelectors,
  injectElementTimingObserver,
  injectElementTimingHandler,
  getElementsTimings
};
