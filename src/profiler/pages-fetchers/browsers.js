const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { chromium: playwright } = require('playwright');
const path = require('path');
const { viewports, userAgents } = require('../viewports.js');

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
    userAgent: userAgents[config.platform],
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

const openBrowser = async ({
                             config,
                             index,
                             httpPort,
                             httpsPort
                           }) => {
  const { logger } = config;

  try {
    await logger(`opening browser`);

    const proxyArgs = getProxyArgs(config, httpPort, httpsPort);

    const browser = config.isPlaywright ? (
      await getContextPlaywright(config, index, proxyArgs)
    ) : (
      await getContextPuppeteer(config, index, proxyArgs)
    );

    await logger('browser are open');

    return browser;
  } catch (e) {
    await logger(`error while opening browser\n${e.stack}`);

    return null;
  }
};

module.exports = {
  openBrowser
};
