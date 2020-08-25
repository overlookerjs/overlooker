const puppeteer = require('puppeteer');
const path = require('path');
const { viewports } = require('./viewports.js');
const constants = require('./constants.js');


const getContext = async (config) => {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-urlfetcher-cert-requests',
      `--user-data-dir=${path.resolve(__dirname, 'browser-cache')}`
    ]
      .concat(config.cache ? [
        `--host-resolver-rules="MAP *:80 127.0.0.1:${constants.HTTP_PORT},MAP *:443 127.0.0.1:${constants.HTTPS_PORT},EXCLUDE localhost"`,
        '--ignore-certificate-errors-spki-list=PhrPvGIaAMmd29hj8BCZOq096yj7uMpRNHpn5PDxI6I='
      ] : [])
      .concat(config.browserArgs)
      .concat(config.proxy ? `--proxy-server=${config.proxy}` : []),
    ignoreHTTPSErrors: true,
    defaultViewport: viewports[config.platform],
    headless: !config.debug,
    handleSIGINT: config.gracefulShutdown
  });

  const context = await browser.createIncognitoBrowserContext();

  return {
    context,
    close: async () => {
      await context.close();
      await browser.close();
    }
  };
};

const open = async (config) => {
  const { threads, logger } = config;

  try {
    await logger(`opening browsers`);

    const browsers = await Promise.all(Array(threads).fill(null).map(() => getContext(config)));

    await logger('browsers are open');

    return browsers;
  } catch (e) {
    await logger(`error while opening browsers\n${e.stack}`);

    return null;
  }
};

const wrap = (browsers) => browsers && browsers.map((browser) => (fn) => fn(browser));

const close = async (browsers) => {
  if (browsers) {
    await Promise.all(browsers.map(({ close }) => close()));
  }
};

module.exports = {
  open,
  wrap,
  close
};
