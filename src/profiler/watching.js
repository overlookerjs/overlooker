const fs = require('fs');
const path = require('path');

const IS_DEBUG = process.argv.some((arg) => arg === '--debug');

const makeCoverageResult = (url, total, used, unused) => ({
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
});

const parseCoveragePuppeteer = (coverage) => (
  coverage.map(({ ranges, url, text }) => {
    const total = text.length;
    const used = ranges.reduce((acc, { start, end }) => acc + (end - start), 0);
    const unused = total - used;

    return makeCoverageResult(url, total, used, unused);
  })
);

const parseCoveragePlaywright = (coverageJs, coverageCss) => (
  [
    ...Object.entries(coverageJs
      .reduce((acc, { url, ...rest }) => {
        if (!acc[url]) {
          acc[url] = [];
        }

        acc[url].push(rest);

        return acc
      }, {}))
      .map(([url, entries]) => {
        const entriesStats = entries
          .map(({ source, functions }) => {
            const total = source.length;
            const unused = functions
              .reduce((acc, { ranges }) => acc + ranges
                  .reduce((acc, {
                      startOffset,
                      endOffset,
                      count
                    }) => count ? acc : acc + (endOffset - startOffset),
                    0),
                0);
            const used = total - unused;

            return { total, used, unused };
          });
        const { total, used, unused } = entriesStats.reduce((acc, { total, used, unused }) => ({
          total: acc.total + total,
          used: acc.used + used,
          unused: acc.unused + unused
        }));

        return makeCoverageResult(url, total, used, unused);
      }),
    coverageCss.map(({ url, text, ranges }) => {
      const total = text.length;
      const used = ranges.reduce((acc, { start, end }) => acc + (end - start), 0);
      const unused = total - used;

      return makeCoverageResult(url, total, used, unused);
    })
  ]
);

const writeTracing = async (context, page, isPlaywright) => {
  const args = {
    categories: [
      '-*',
      'blink.console',
      'blink.user_timing',
      'blink.user_timing,rail',
      'devtools.timeline',
      'devtools.timeline,rail',
      'disabled-by-default-cpu_profiler',
      'disabled-by-default-cpu_profiler.debug',
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
  };

  if (isPlaywright) {
    await context.browser().startTracing(page, args);
  } else {
    await page.tracing.start(args);
  }

  const stopTracing = async () => {
    if (isPlaywright) {
      return await context.browser().stopTracing();
    } else {
      return await page.tracing.stop();
    }
  }

  return async () => {

    const tracing = JSON.parse((await stopTracing()).toString());

    if (IS_DEBUG) {
      fs.writeFileSync(path.resolve(__dirname, './tracing.json'), JSON.stringify(tracing));
    }

    return tracing.traceEvents;
  }
};

const writeCoverage = async (page, isPlaywright) => {
  await Promise.all([
    page.coverage.startJSCoverage(),
    page.coverage.startCSSCoverage()
  ]);

  return async () => {
    const [js, css] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage(),
    ]);

    if (isPlaywright) {
      return parseCoveragePlaywright(js, css);
    } else {
      return parseCoveragePuppeteer([...js, ...css]);
    }
  };
};

const watch = async (context, page, isPlaywright) => {
  if (!isPlaywright) {
    await page.setRequestInterception(false);
  }

  const getCoverage = await writeCoverage(page, isPlaywright);
  const getTracing = await writeTracing(context, page, isPlaywright);

  if (!isPlaywright) {
    await page.setRequestInterception(true);
  }

  return async () => ({
    coverage: await getCoverage(),
    tracing: await getTracing()
  });
};

module.exports = {
  watch,
};
