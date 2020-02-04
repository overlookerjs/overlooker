const { filterEventsByName } = require('./events-helpers.js');

const getScriptsEvaluation = (events) => filterEventsByName(events, 'EvaluateScript')
  .map((event) => ({
    duration: event.dur,
    url: event.args.data && event.args.data.url,
    timings: {
      start: event.ts,
      end: event.ts + event.dur
    }
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

const makeScriptsEvaluationMap = (evaluation) => evaluation
  .reduce((acc, item) => {
    if (!acc[item.url]) {
      acc[item.url] = [];
    }

    acc[item.url].push(item);

    return acc;
  }, {});

const getScriptsEvaluationStats = (evaluation, internalTest) => {
  const internal = evaluation
    .filter(({ url }) => internalTest(url))
    .reduce((acc, { duration }) => acc + duration, 0) / 1000;
  const total = evaluation
    .reduce((acc, { duration }) => acc + duration, 0) / 1000;
  const external = total - internal;

  return {
    internal,
    total,
    external
  };
};

module.exports = {
  getScriptsEvaluation,
  getScriptsEvaluationStats,
  getFunctionsCalls,
  makeScriptsEvaluationMap
};
