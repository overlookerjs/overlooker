const puppeteer = require('puppeteer');
const path = require('path');
const { viewports } = require('./viewports.js');
const constants = require('./constants.js');

const getContext = async (config, index, httpPort, httpsPort) => {
  const usrDir = path.resolve(__dirname, `browser-cache/instance-${index}`);

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-urlfetcher-cert-requests',
      `--user-data-dir=${usrDir}`
    ]
      .concat(config.cache ? [
        `--host-resolver-rules="MAP *:80 127.0.0.1:${httpPort},MAP *:443 127.0.0.1:${httpsPort},EXCLUDE localhost"`,
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

const open = async (config, onePort) => {
  const { threads, logger } = config;

  let httpPort = constants.HTTP_PORT;
  let httpsPort = constants.HTTPS_PORT;

  try {
    await logger(`opening browsers`);

    const browsers = await Promise.all(Array(threads).fill(null).map(async (n, index) => {
      if (!onePort) {
        httpPort = httpPort + 1;
        httpsPort = httpsPort + 1;
      }

      return await getContext(config, index, httpPort, httpsPort);
    }));

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
