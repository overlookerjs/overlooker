const getEventsTimestamps = (events, names) => filterEventsByName(events, names)
  .reduce((acc, { name, ts }) => {
    acc[name] = ts;

    return acc;
  }, {});

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
  makeEventsRelative
};
