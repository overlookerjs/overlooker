const { make } = require('../objects-utils.js');

const insertToNested = (eventLeaf, insertedEvent) => {
  const { event, children } = eventLeaf;

  if (event.ts <= insertedEvent.ts && insertedEvent.ts <= event.ts + event.dur && (!insertedEvent.dur || event.dur >= insertedEvent.dur)) {
    const insertedToChildren = children.some((child) => insertToNested(child, insertedEvent));

    if (!insertedToChildren) {
      children.push({
        event: insertedEvent,
        children: []
      });
    }

    return true;
  }

  return false;
};

const castThreadName = (threadEvent) => {
  const name = threadEvent && threadEvent.args.name;

  switch (name) {
    case 'CrRendererMain':
    case 'CrBrowserMain':
      return 'main';
    case 'ThreadPoolForegroundWorker':
      return 'worker';
    case 'Compositor':
      return 'compositor';
    case 'NetworkService':
      return 'networkService';
    default:
      return 'unknown';
  }
};

const getEventsByThreads = (events) => (
  Object.values(
    events.reduce((acc, event) => {
      if (!acc[event.tid]) {
        acc[event.tid] = [];
      }

      acc[event.tid].push(event);

      return acc;
    }, {})
  )
    .map((events) => ({
      name: castThreadName(events.find(({ name }) => name === 'thread_name')),
      events
    }))
    .filter(({ name }) => name !== 'unknown')
);

const getEventsTree = (events) => (
  events
    .reduce((acc, event) => {
      if (!acc.some((ev) => insertToNested(ev, event))) {
        acc.push({
          event,
          children: []
        });
      }

      return acc;
    }, [])
);

const filterByNestedSequenceEvents = (eventsTree, [name, ...rest]) => eventsTree
  .filter(({ event, children }) => event.name === name && (!rest.length || filterByNestedSequenceEvents(children, rest).length));

const filterByNestedEvent = (eventsTree, name) => eventsTree
  .filter(({ event, children }) => event.name === name || filterByNestedEvent(children, name).length);

const getNestedEventsBySequence = (eventsTree, [name, ...rest], acc = []) => eventsTree
  .reduce((acc, entry) => {
    const { event, children } = entry;
    if (event.name === name) {
      if (rest.length !== 0) {
        getNestedEventsBySequence(children, rest, acc);
      } else {
        acc.push(entry);
      }
    }

    return acc;
  }, acc);

const getEventsTreeByThreads = (events) => getEventsByThreads(events)
  .map(({ name, events: threadEvents }) => ({ name, events: getEventsTree(threadEvents) }));

module.exports = {
  filterByNestedSequenceEvents,
  filterByNestedEvent,
  getEventsTreeByThreads,
  getNestedEventsBySequence
};
