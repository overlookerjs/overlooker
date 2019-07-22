const { filterEventsByName } = require('./events-helpers.js');

const getScriptsEvaluating = (events) => filterEventsByName(events, 'EvaluateScript')
  .map((event) => ({
    duration: event.dur,
    startTime: event.ts,
    url: event.args.data && event.args.data.url
  }));

const getFunctionsCalls = (events) => {
  const functions = filterEventsByName(events, 'FunctionCall');

  const begins = functions.filter(({ ph }) => ph === 'B');
  const endings = functions.filter(({ ph }) => ph === 'E');

  const pairs = begins
    .map((begin) => [begin, endings.find(({ tid }) => tid === begin.tid)])
    .filter(([, end]) => end);

  return pairs
    .map(([begin, end]) => {
      const duration = end.ts - begin.ts;
      const { url } = begin.args.data;

      return {
        duration,
        url,
        timings: {
          start: begin.ts,
          end: end.ts
        }
      }
    });
};

const makeScriptsEvaluatingMap = (evaluating) => evaluating
  .reduce((acc, item) => {
    if (!acc[item.url]) {
      acc[item.url] = [];
    }

    acc[item.url].push(item);

    return acc;
  }, {});

const getScriptsEvaluatingStats = (evaluating, internalTest) => {
  const internalScriptsEvaluating = evaluating
    .filter(({ url }) => internalTest(url))
    .reduce((acc, { duration }) => acc + duration, 0) / 1000;
  const totalScriptsEvaluating = evaluating
    .reduce((acc, { duration }) => acc + duration, 0) / 1000;
  const externalScriptsEvaluating = totalScriptsEvaluating - internalScriptsEvaluating;

  return {
    internalScriptsEvaluating,
    externalScriptsEvaluating,
    totalScriptsEvaluating
  };
};

module.exports = {
  getScriptsEvaluating,
  getScriptsEvaluatingStats,
  getFunctionsCalls,
  makeScriptsEvaluatingMap
};
