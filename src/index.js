const { profile } = require('./profiler');
const compare = () => {};


const start = async () => {
  const data = await profile({
    count: 1,
    pages: {
      main: 'https://www.avito.ru'
    },
    threads: 1,
    platform: 'desktop'
  });

  debugger;
};

start();

module.exports = {
  profile,
  compare
};
