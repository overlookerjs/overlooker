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
const scriptEvfaluatingTopScripts = getScriptsEvaluating(traceEvents)
  .map(({dur, args: {data: {url}}}) => ({dur, url}))
  .filter(({url}) => url)
  .sort(({dur: fdur}, {dur: sdur}) => sdur - fdur);



