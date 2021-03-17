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
      'blink.console',
      'blink.user_timing',
      'blink.user_timing,rail',
      'devtools.timeline',
      'devtools.timeline,rail',
      "disabled-by-default-cpu_profiler",
      "disabled-by-default-cpu_profiler.debug",
      'disabled-by-default-devtools.screenshot',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame',
      'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-v8.compile',
      'disabled-by-default-v8.cpu_profile',
      'disabled-by-default-v8.cpu_profiler',
      'disabled-by-default-v8.cpu_profiler.hires',
      'latencyInfo',
      'layout_shift.debug',
      'v8,devtools.timeline',
      'v8.execute'
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

  const getCoverage = await writeCoverage(page);
  const getTracing = await writeTracing(page);

  await page.setRequestInterception(true);

  return async () => ({
    coverage: await getCoverage(),
    tracing: await getTracing()
  });
};

module.exports = {
  watch,
};
