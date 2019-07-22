const getEventsTimestamps = (events, names) => events
  .filter(({ name }) => names.includes(name))
  .reduce((acc, { name, ts }) => {
    acc[name] = ts;

    return acc;
  }, {});

const makeEventsRelative = (events, relativeEvent) => events.map((event) => ({
  ...event,
  ts: event.ts - relativeEvent.ts
}));

const findEventByName = (events, name) => events.find((event) => event.name === name);

const filterEventsByName = (names) =>
  (events) => events.filter(({ name }) => names.includes(name));

module.exports = {
  getEventsTimestamps,
  findEventByName,
  filterEventsByName,
  makeEventsRelative
};
