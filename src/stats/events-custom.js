const { objFill } = require('./../objects-utils.js');

const rootSymbol = Symbol('root');

const markRegExp = /^overlooker\.metrics\.(mark):(.*?)$/i;
const durationRegExp = /^overlooker\.metrics\.duration\.(start|end):(.*?)(?:#(.*?))?$/i;

const getCustomMetrics = (events) => {
  const marks = objFill(
    events
      .filter((event) => markRegExp.test(event.name))
      .map((event) => [markRegExp.match(event)[1].split('.'), event.ts])
  );
  const durations = objFill(
    Object.entries(
      Object.entries(
        objFill(
          events
            .filter((event) => durationRegExp.test(event.name))
            .map((event) => {
              const [, type, name, hash = rootSymbol] = durationRegExp.match(event);

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
              if (hash !== rootSymbol) {
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
