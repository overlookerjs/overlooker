const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { chromium: playwright } = require('playwright');
const path = require('path');
const { viewports } = require('./viewports.js');
const constants = require('./constants.js');

puppeteer.use(StealthPlugin());

const mainArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--ignore-certificate-errors',
  '--ignore-urlfetcher-cert-requests',
  '--no-zygote',
  '--disable-dev-shm-usage',
]

const getProxyArgs = (config, httpPort, httpsPort = httpPort) => {
  const isProxyCache = config.cache && config.cache.type === 'proxy' && config.cache.host;
  const isWprCache = config.cache && config.cache.type === 'wpr';
  const isMitmdump = config.cache && config.cache.type === 'mitmdump';

  return []
    .concat(isWprCache ? [
      `--host-resolver-rules="MAP *:80 127.0.0.1:${httpPort},MAP *:443 127.0.0.1:${httpsPort},EXCLUDE localhost"`,
      '--ignore-certificate-errors-spki-list=PhrPvGIaAMmd29hj8BCZOq096yj7uMpRNHpn5PDxI6I='
    ] : [])
    .concat(isProxyCache ? `--proxy-server=${config.cache.host}` : [])
    .concat(isMitmdump ? `--proxy-server=http://localhost:${httpPort}` : [])
}

const getContextPuppeteer = async (config, index, proxyArgs) => {
  const usrDir = path.resolve(__dirname, `browser-cache/instance-${index}`);

  const browser = await puppeteer.launch({
    args: [
      ...mainArgs,
      ...proxyArgs,
      ...config.browserArgs,
      `--user-data-dir=${usrDir}`
    ],
    ignoreHTTPSErrors: true,
    defaultViewport: viewports[config.platform],
    headless: !config.debug,
    handleSIGINT: config.gracefulShutdown,
    devtools: config.devtools
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

const getContextPlaywright = async (config, index, proxyArgs) => {
  const isMobile = config.platform === 'mobile';

  const browser = await playwright.launch({
    args: [
      ...mainArgs,
      ...proxyArgs,
      ...config.browserArgs
    ],
    headless: !config.debug,
    handleSIGINT: config.gracefulShutdown,
    devtools: config.devtools,
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    isMobile: isMobile,
    viewport: viewports[isMobile ? 'mobile' : 'desktop']
  });

  return {
    context,
    close: async () => {
      await browser.close();
      await context.close();
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

      const proxyArgs = getProxyArgs(config, httpPort, httpsPort);

      return config.isPlaywright ? (
        await getContextPlaywright(config, index, proxyArgs)
      ) : (
        await getContextPuppeteer(config, index, proxyArgs)
      );
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
