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

const filterCategories = (events, excludedCategories) => events.filter(({ cat }) => !excludedCategories.includes(cat));

const castMarkName = (name) => {
  if (name.startsWith('elementsTimings')) {
    return {
      shortName: 'ET',
      color: '#4cd05a'
    };
  } else if (name.startsWith('timings') || name.startsWith('userCentric')) {
    const [, timingName] = name.split('.');

    switch (timingName) {
      case 'firstMeaningfulPaint':
        return {
          shortName: 'FMP',
          color: '#4cd05a'
        };
      case 'firstPaint':
        return {
          shortName: 'FP',
          color: '#45ba51'
        };
      case 'firstContentfulPaint':
        return {
          shortName: 'FCP',
          color: '#2f8137'
        };
      case 'largestContentfulPaint':
        return {
          shortName: 'LCP',
          color: '#4ed65d'
        };
      case 'domInteractive':
        return {
          shortName: 'DI',
          color: '#3b6ca4'
        };
      case 'domContentLoadedEventStart':
        return {
          shortName: 'DCL',
          color: '#b05757'
        };
      case 'domComplete':
        return {
          shortName: 'DC',
          color: '#d7803c'
        };
      case 'loadEventStart':
        return {
          shortName: 'LE',
          color: '#49c8bf'
        };
      case 'timeToInteractive':
        return {
          shortName: 'TTI',
          color: '#deb743'
        };
      default:
        return null;
    }
  }

  return null;
}

module.exports = {
  getEventsTimestamps,
  findEventByName,
  filterEventsByName,
  filterByFrame,
  makeEventsRelative,
  getLastEvent,
  getTimestamps,
  filterCategories,
  castMarkName
};
