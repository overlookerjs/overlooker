const { sliceEventsTreeLevel } = require('./events-tree.js');
const { map } = require('../objects-utils.js');

const makeScriptsEvaluationMap = (evaluation) => evaluation
  .reduce((acc, item) => {
    if (!acc[item.url]) {
      acc[item.url] = [];
    }

    acc[item.url].push(item);

    return acc;
  }, {});

const separateEvaluationByType = (events) => events
  .reduce((acc, event) => {
    if (!acc[event.type]) {
      acc[event.type] = [];
    }

    acc[event.type].push(event);
    acc.total.push(event);

    return acc;
  }, { total: [] });

const separateEvaluationByOrigin = (events, internalTest) => events
  .reduce((acc, event) => {
    const isInternal = internalTest(event.url);

    acc[isInternal ? 'internal' : 'external'].push(event);

    acc.total.push(event);

    return acc;
  }, {
    total: [],
    internal: [],
    external: []
  });

const getScriptsEvaluationStats = (evaluation, internalTest) => {
  const separatedByOrigin = separateEvaluationByOrigin(evaluation, internalTest);

  return map(
    separatedByOrigin,
    (events) => map(
      separateEvaluationByType(events),
      (nestedEvents) => nestedEvents.reduce((acc, { duration }) => acc + duration, 0)
    )
  );
};

const meaningEvaluationEventNames = [
  'FunctionCall',
  'EvaluateScript',
  'ParseHTML',
  'EventDispatch',
  'TimerFire',
  'FireIdleCallback',
  'XHRReadyStateChange',
  'FireAnimationFrame',
];

const extractPayloadFromEvent = (type, event, eventWithUrl = event) => ({
  type,
  duration: event.duration,
  url: (eventWithUrl.data ? eventWithUrl.data.url : '') || '',
  timings: {
    start: event.start,
    end: event.start + event.duration
  }
});

const castEventToPayload = (name, events) => {
  switch (name) {
    case 'FunctionCall':
    case 'EvaluateScript':
      return events.map((event) => extractPayloadFromEvent('EvaluateScript', event, { data: { url: event.data.data.url } }));
    case 'ParseHTML':
      return events
        .map((event) => extractPayloadFromEvent('ParseHTML', {
          start: event.start,
          duration: event.duration - (event.children ? event.children.reduce((acc, { duration }) => acc + duration, 0) : 0)
        }, { data: { url: event.data.beginData.url } }))
        .concat(
          prepareEvaluations(
            getMeaningEvaluationEvents(
              events.reduce((acc, { children }) => children ? acc.concat(children) : acc, []).filter(({name}) => name !== 'ParseHTML'),
              false
            )
          )
        );
    case 'EventDispatch':
      return events
        .filter(({ children }) => children)
        .map(({ children }) => children
          .filter(({ name }) => name === 'FunctionCall')
          .map((event) => extractPayloadFromEvent('EventDispatch', event))
        )
        .reduce((acc, arr) => acc.concat(arr), []);
    case 'TimerFire':
    case 'FireIdleCallback':
      return events
        .filter(({ children }) => children)
        .map((event) => extractPayloadFromEvent(
          'TimerFire', // ToDo: should be more understandable
          event,
          event.children.find(({ event: { name } }) => name === 'FunctionCall')
        ));
    case 'XHRReadyStateChange':
      return events
        .filter(({ children }) => children)
        .map((event) => extractPayloadFromEvent(
          'XHRReadyStateChange',
          event
        ));
    case 'FireAnimationFrame':
      return events
        .filter(({ children }) => children)
        .map(({ children }) => children
          .map((event) => extractPayloadFromEvent(
            'FireAnimationFrame',
            event,
            event.children.find(({ event: { name } }) => name === 'FunctionCall'))
          ))
        .reduce((acc, arr) => acc.concat(arr), []);
  }
};

const prepareEvaluations = (meaningEvaluations) => Object.entries(meaningEvaluations)
  .map(([name, events]) => castEventToPayload(name, events))
  .reduce((acc, arr) => acc.concat(arr), []);

const getMeaningEvaluationEvents = (threadEvents, withSlice = true) => {
  const slicedTree = withSlice ? sliceEventsTreeLevel(threadEvents) : threadEvents;

  return slicedTree.reduce((acc, event) => {
    if (meaningEvaluationEventNames.includes(event.name)) {
      if (!acc[event.name]) {
        acc[event.name] = [];
      }

      acc[event.name].push(event);
    }

    return acc;
  }, {}) ;
};

module.exports = {
  getScriptsEvaluationStats,
  makeScriptsEvaluationMap,
  getMeaningEvaluationEvents,
  prepareEvaluations
};
