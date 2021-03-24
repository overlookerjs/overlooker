const castThreadName = (threadEvent) => {
  const name = threadEvent && threadEvent.args.name;

  if (!name) {
    return 'Other';
  }

  switch (name) {
    case 'CrRendererMain':
      return 'Main';
    case 'CrBrowserMain':
      return 'BrowserMain';
    default:
      return name;
  }
};

const getEventsGroups = (events) => (
  Object.values(
    events
      .filter(({ tid }) => tid)
      .reduce((acc, event) => {
        const key = `${event.tid}-${event.pid}`;

        if (!acc[key]) {
          acc[key] = [];
        }

        acc[key].push(event);

        return acc;
      }, {})
  )
    .map((events) => ({
      name: castThreadName(events.find(({ name }) => name === 'thread_name')),
      events
    }))
    .reduce((acc, bunch) => {
      // workaround for linux - tracing in linux has independent thread
      // for rendering screenshots and he has the same identifier
      // in thread_name event as a main thread
      if (bunch.name === 'main' && acc.some((handledBunch) => handledBunch.name === bunch.name)) {
        const bunchIndex = acc.findIndex((handledBunch) => handledBunch.name === bunch.name);

        acc[bunchIndex] = {
          name: 'main',
          events: acc[bunchIndex].events.concat(bunch.events)
        };
      } else {
        acc.push(bunch);
      }

      return acc;
    }, [])
);

const insertToNested = (eventLeaf, insertedEvent) => {
  const { event, children } = eventLeaf;

  if (event.ts <= insertedEvent.ts && insertedEvent.ts < event.ts + event.dur && (!insertedEvent.dur || event.dur >= insertedEvent.dur)) {
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

const getEventsTree = (events) => {
  let root = {
    event: {
      name: 'root',
      ts: -Infinity,
      dur: Infinity
    },
    children: [],
    parent: null
  };

  let currentParentEvent = root;

  for (let event of events.filter(({ dur }) => dur)) {
    while (
      event.ts < currentParentEvent.event.ts // event starts early
      || event.ts >= Math.round(currentParentEvent.event.ts + currentParentEvent.event.dur) // event starts lately
      || Math.round(event.ts + event.dur) > Math.round(currentParentEvent.event.ts + currentParentEvent.event.dur)
      ) {
      currentParentEvent = currentParentEvent.parent;
    }

    const nestedEvent = {
      parent: currentParentEvent,
      children: [],
      event
    }

    currentParentEvent.children.push(nestedEvent);

    currentParentEvent = nestedEvent;
  }

  return root.children;
}

const filterByNestedSequenceEvents = (eventsTree, [name, ...rest]) => eventsTree
  .filter((event) => event.name === name && (!rest.length || filterByNestedSequenceEvents(event.children, rest).length));

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

const getEventsTreeByGroups = (events) => getEventsGroups(events)
  .map(({ name, events: threadEvents }) => ({
    name,
    events: getEventsTree(threadEvents)
  }));

const sliceEventsTreeLevel = (events) => events.reduce((acc, { children }) => children ? acc.concat(children) : acc, []);

const sliceEventsTreeEvent = (events, eventName) => events.reduce((acc, event) => (
  event.name === eventName ? acc.concat(event.children) : acc.concat(event), []
));

module.exports = {
  filterByNestedSequenceEvents,
  filterByNestedEvent,
  getEventsTreeByGroups,
  getNestedEventsBySequence,
  getEventsTree,
  getEventsGroups,
  sliceEventsTreeLevel,
  sliceEventsTreeEvent
};
