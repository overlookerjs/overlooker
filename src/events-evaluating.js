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
      const { functionName, url } = begin.args.data;

      return {
        functionName,
        duration,
        url,
        start: begin.ts,
        end: end.ts
      }
    });
};

module.exports = {
  getScriptsEvaluating,
  getFunctionsCalls
};
