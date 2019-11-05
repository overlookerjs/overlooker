const { fill } = require('./../objects-utils.js');

const defaultHash = 'nearest-marks';

const markRegExp = /^overlooker\.metrics\.mark:(.*?)$/i;
const durationRegExp = /^overlooker\.metrics\.duration\.(start|end):(.*?)(?:#(.*?))?$/i;

const getCustomMetrics = (events) => {
  const marks = fill(
    events
      .filter((event) => markRegExp.test(event.name))
      .map((event) => [event.name.match(markRegExp)[1].split('.'), event.ts])
  );
  const durations = fill(
    Object.entries(
      Object.entries(
        fill(
          events
            .filter((event) => durationRegExp.test(event.name))
            .map((event) => {
              const [, type, name, hash = defaultHash] = event.name.match(durationRegExp);

              return [
                [
                  hash,
                  name,
                  type,
                ],
                event.ts
              ];
            })
        )
      )
        .reduce((acc, [hash, event]) => (
          Object.entries(event)
            .reduce((acc, [name, { start, end }]) => {
              if (hash !== defaultHash) {
                if (acc[name]) {
                  acc[name] = {
                    total: acc[name].total + (end - start),
                    count: acc[name].count + 1
                  };
                } else {
                  acc[name] = {
                    total: (end - start),
                    count: 1
                  };
                }
              } else {
                acc[name] = end - start;
              }

              return acc;
            }, acc)
        ), {})
    )
      .map(([name, value]) => [name.split('.'), value])
  );

  return {
    marks,
    durations
  }
};

module.exports = {
  getCustomMetrics
};
