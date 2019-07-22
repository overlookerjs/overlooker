const {traceEvents} = require('./trace.json');

const getFieldsValues = (field) => (events) => [...new Set(events.map(({[field]: value}) => value))]
  .sort((a, b) => a.localeCompare(b));

const getEventsNames = getFieldsValues('name');
const getEventsCats = getFieldsValues('cat');

const eventsNames = getEventsNames(traceEvents);
const eventsCats = getEventsCats(traceEvents);

const getEventsNamesWithCount = (events) => Object.entries(events.map(({name}) => name)
  .reduce((acc, name) => ({
    ...acc,
    [name]: (acc[name] || 0) + 1
  }), {}))
  .sort(([, fcount], [, scount]) => scount - fcount);

const eventsNamesWithCount = getEventsNamesWithCount(traceEvents);

const getScriptsEvaluating = (events) => events.filter(({name}) => name === 'EvaluateScript');

const scriptEvaluating = getScriptsEvaluating(traceEvents);
const scriptEvaluatingTotalDuration = scriptEvaluating.reduce((acc, {dur}) => acc + dur, 0) / 1000;
const scriptEvaluatingTopScripts = getScriptsEvaluating(traceEvents)
  .map(({dur, args: {data: {url}}}) => ({dur, url}))
  .filter(({url}) => url)
  .sort(({dur: fdur}, {dur: sdur}) => sdur - fdur);


const getFunctionsCalls = (events) => {
  const functions = events
    .filter(({name}) => name === 'FunctionCall');

  const begins = functions.filter(({ph}) => ph === 'B');
  const endings = functions.filter(({ph}) => ph === 'E');

  const pairs = begins
    .map((begin) => [begin, endings.find(({tid}) => tid === begin.tid)])
    .filter(([, end]) => end);

  const clearCalls = pairs
    .map(([begin, end]) => {
      const duration = end.ts - begin.ts;
      const {functionName, url} = begin.args.data;

      return {
        functionName,
        duration,
        url,
        start: begin.ts,
        end: end.ts
      }
    });
};
