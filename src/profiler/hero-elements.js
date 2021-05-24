const { asyncMap } = require('./../objects-utils.js');
const fs = require('fs');

const GLOBAL_OET_NAME = '__oet__';

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

const runElementTimingObserver = (oetPropName) => {
  if (!window[oetPropName]) {
    window[oetPropName] = [];

    new PerformanceObserver(function(list) {
      window[oetPropName].push(...list.getEntries());
    }).observe({ entryTypes: ['element'] });
  }
};

const injectElementTimingObserver = async (page, isPlaywright) => {
  /* istanbul ignore next */
  await (isPlaywright ? (
    page.addInitScript(runElementTimingObserver, GLOBAL_OET_NAME)
  ) : (
    page.evaluateOnNewDocument(runElementTimingObserver, GLOBAL_OET_NAME)
  ));
};

const injectElementTimingHandler = async (page) => {
  await page.addScriptTag({
    type: 'module',
    content: `
      ${fs.readFileSync(require.resolve('overlooker-element-timing'))}
      
      if (!(window['${GLOBAL_OET_NAME}'] instanceof OverlookerElementTiming)) {
        new OverlookerElementTiming('${GLOBAL_OET_NAME}');
      }
  `
  });
};

const getElementsTimings = async (page, isPlaywright) => {
  /* istanbul ignore next */
  await page.waitForFunction((oetPropName) => !!(window[oetPropName] && window[oetPropName].getAll), isPlaywright ? GLOBAL_OET_NAME : {}, isPlaywright ? {} : GLOBAL_OET_NAME);

  /* istanbul ignore next */
  return await page.evaluate((oetPropName) => {
    const timingEntries = window[oetPropName].getAll();

    window[oetPropName].clear();

    return timingEntries;
  }, GLOBAL_OET_NAME);
};

const waitForElementTiming = async (page, timingName) => {
  return await page.evaluate(({ timingName, oetPropName }) => {
    return new Promise((resolve, reject) => window[oetPropName].observe((entry) => {
      const timeout = setTimeout(reject, 60000);

      if (entry.name === timingName) {
        clearTimeout(timeout);
        resolve()
      }
    }, true))
  }, {
    timingName,
    oetPropName: GLOBAL_OET_NAME
  })
};

module.exports = {
  getPaintEventsBySelectors,
  injectElementTimingObserver,
  injectElementTimingHandler,
  getElementsTimings,
  waitForElementTiming
};
