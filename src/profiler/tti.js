const path = require('path');

const globalTTIName = 'overlookerTTI';

const runTTIObserver = (name) => {
  if (window[name]) {
    return;
  }

  const globalTTI = window[name] = { e: [] };

  globalTTI.o = new PerformanceObserver(function(list) {
    const entries = list.getEntries();

    globalTTI.e = globalTTI.e.concat(entries);
  });

  globalTTI.o.observe({ entryTypes: ['longtask'] });
};

const injectLongTasksObserver = async (page) => {
  /* istanbul ignore next */
  await page.evaluateOnNewDocument(runTTIObserver, globalTTIName);
};

const getTti = async (page, logger, firstEvent) => {
  let ttiPolyfillUpdates = 0;

  await page.exposeFunction('countTtiPolyfillUpdate', () => {
    ++ttiPolyfillUpdates;

    if (ttiPolyfillUpdates > 1) {
      logger('ttiPolyfill was rewritten')
    }
  });

  /* istanbul ignore next */
  await page.evaluate(() => {
    let target = null;

    Object.defineProperty(window, 'ttiPolyfill', {
      configurable: true,
      set(value) {
        target = value;
        window.countTtiPolyfillUpdate();
      },
      get() {
        return target;
      }
    })
  });

  await page.addScriptTag({ path: path.resolve(__dirname, './tti-polyfill.js') });

  /* istanbul ignore next */
  const result = await page.evaluate(async ({ ttiPropName, firstEvent }) => {
    const firstEventValue = window.performance.getEntriesByType("navigation")[0][firstEvent];
    const errRes = 60000;

    if (!window.ttiPolyfill || !window.ttiPolyfill.getFirstConsistentlyInteractive) {
      return errRes;
    }

    const res = await new Promise(async (resolve) => {
        setTimeout(() => {
            resolve(errRes);       
        }, 60000)

        const ttiRes = await window.ttiPolyfill.getFirstConsistentlyInteractive({ ttiPropName });

        resolve(ttiRes - firstEventValue);
    })

    return res;
  }, { ttiPropName: globalTTIName, firstEvent });

  return result * 1000;
};

module.exports = {
  injectLongTasksObserver,
  getTti
};
