const fs = require('fs');
const path = require('path');

const IS_DEBUG = process.argv.some((arg) => arg === '--debug');

const parseCoverage = (coverage) => (
  coverage.map(({ ranges, url, text }) => {
    const total = text.length;
    const used = ranges.reduce((acc, { start, end }) => acc + (end - start), 0);
    const unused = total - used;

    return {
      url,
      absolute: {
        total,
        unused,
        used
      },
      percent: {
        used: total ? used / total : 0,
        unused: total ? unused / total : 0
      }
    }
  })
);

const writeTracing = async (page) => {
  await page.tracing.start({
    categories: [
      '-*',
      'blink.user_timing',
      'blink.user_timing,rail',
      'devtools.timeline',
      'loading,rail,devtools.timeline',
      'disabled-by-default-devtools.screenshot',
      'layout_shift.debug'
    ]
  });

  return async () => {
    const tracing = JSON.parse((await page.tracing.stop()).toString());

    if (IS_DEBUG) {
      fs.writeFileSync(path.resolve(__dirname, './tracing.json'), JSON.stringify(tracing));
    }

    return tracing.traceEvents;
  }
};

const writeCoverage = async (page) => {
  await Promise.all([
    page.coverage.startJSCoverage(),
    page.coverage.startCSSCoverage()
  ]);

  return async () => {
    const [js, css] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage(),
    ]);

    return parseCoverage([...js, ...css]);
  };
};

const watch = async (page) => {
  await page.setRequestInterception(false);

  const getTracing = await writeTracing(page);
  const getCoverage = await writeCoverage(page);

  await page.setRequestInterception(true);

  return async () => ({
    coverage: await getCoverage(),
    tracing: await getTracing()
  });
};

module.exports = {
  watch,
};
