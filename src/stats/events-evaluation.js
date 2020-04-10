const { filterByNestedSequenceEvents, getNestedEventsBySequence } = require('./events-tree.js');
const { make, map } = require('../objects-utils.js');
const { filterEventsByName } = require('./events-helpers.js');

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

const meaningEvaluationEventNames = {
  functionCall: ['FunctionCall'],
  evaluateScript: ['EvaluateScript'],
  parseHTML: ['ParseHTML'],
  eventDispatch: ['EventDispatch', 'FunctionCall'],
  timerFire: ['TimerFire', 'FunctionCall'],
  fireIdleCallback: ['FireIdleCallback', 'FunctionCall'],
  xhrReadyStateChange: ['ResourceDispatcher::OnRequestComplete', 'WebURLLoaderImpl::Context::OnCompletedRequest', 'XHRReadyStateChange', 'FunctionCall'],
  startLoadResponseBody: ['URLLoaderClientImpl::OnStartLoadingResponseBody', 'XHRReadyStateChange', 'FunctionCall'],
  animationFrame: ['PageAnimator::serviceScriptedAnimations', 'FireAnimationFrame', 'FunctionCall']
};

const extractPayloadFromEvent = (type, event, eventWithUrl = { event }) => ({
  type,
  duration: event.dur,
  url: (eventWithUrl.event.args.data ? eventWithUrl.event.args.data.url : '') || '',
  timings: {
    start: event.ts,
    end: event.ts + event.dur
  }
});

const castEventToPayload = (name, events) => {
  switch (name) {
    case 'functionCall':
    case 'evaluateScript':
      return events.map(({ event }) => extractPayloadFromEvent('evaluation', event));
    case 'parseHTML':
      return events.map(({ event }) => extractPayloadFromEvent('parseHTML', event, { event: { args: { data: { url: event.args.beginData.url } } } }));
    case 'eventDispatch':
      return events
        .map(({ children }) => children
          .filter(({ event: { name } }) => name === 'FunctionCall')
          .map(({ event }) => extractPayloadFromEvent('event', event))
        )
        .reduce((acc, arr) => acc.concat(arr), []);
    case 'timerFire':
    case 'fireIdleCallback':
      return events
        .map(({ event, children }) => extractPayloadFromEvent(
          'timer',
          event,
          children.find(({ event: { name } }) => name === 'FunctionCall')
        ));
    case 'xhrReadyStateChange':
    case 'startLoadResponseBody':
      return events
        .map(({ event, children }) => extractPayloadFromEvent(
          'xhr',
          event,
          getNestedEventsBySequence(children, meaningEvaluationEventNames[name].slice(1))[0]
        ));
    case 'animationFrame':
      return events
        .map(({ children }) => children
          .map(({ event, children }) => extractPayloadFromEvent(
            'animation',
            event,
            children.find(({ event: { name } }) => name === 'FunctionCall'))
          ))
        .reduce((acc, arr) => acc.concat(arr), []);
  }
};

const prepareEvaluations = (meaningEvaluations) => Object.entries(meaningEvaluations)
  .map(([name, events]) => castEventToPayload(name, events))
  .reduce((acc, arr) => acc.concat(arr), []);

const getMeaningEvaluationEvents = (threadEvents) => {
  return map(meaningEvaluationEventNames, (eventNames) =>
    filterByNestedSequenceEvents(threadEvents, eventNames)
  );
};

module.exports = {
  getScriptsEvaluationStats,
  makeScriptsEvaluationMap,
  getMeaningEvaluationEvents,
  prepareEvaluations
};
