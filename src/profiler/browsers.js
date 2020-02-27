const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const pixel2 = devices['Pixel 2'];

const viewports = {
  mobile: pixel2.viewport,
  desktop: {
    width: 1366,
    height: 768
  }
};

const getContext = async (config) => {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-urlfetcher-cert-requests'
    ]
      .concat(config.browserArgs)
      .concat(config.proxy && config.proxy.address ? `--proxy-server=${config.proxy.address}` : []),
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
