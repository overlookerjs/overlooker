const { map, filter } = require('./../objects-utils.js');

const getLastEvent = (events, name, condition = () => true) => {
  for (let index = events.length - 1; index--;) {
    const evt = events[index];

    if (evt && evt.name === name && condition(evt, index, events) === true) {
      return evt;
    }
  }
};

const getEventsTimestamps = (events, names) => filterEventsByName(events, names)
  .reduce((acc, { name, ts }) => {
    acc[name] = ts;

    return acc;
  }, {});

const getTimestamps = (eventsMap) => map(filter(eventsMap, (event) => event), ({ ts }) => ts);

const makeEventsRelative = (events, relativeEvent) => events.map((event) => ({
  ...event,
  ts: event.ts - relativeEvent.ts
}));

const findEventByName = (events, name, isLast) => (isLast ? events.slice().reverse() : events).find((event) => event.name === name);

const filterEventsByName = (events, names) => events.filter(({ name }) => names.includes(name));

const filterByFrame = (events, frame) => events.filter(({ args }) => args && args.frame === frame);

module.exports = {
  getEventsTimestamps,
  findEventByName,
  filterEventsByName,
  filterByFrame,
  makeEventsRelative,
  getLastEvent,
  getTimestamps
};
