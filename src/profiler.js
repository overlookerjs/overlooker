const puppeteer = require('puppeteer');

const getContext = async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ignoreHTTPSErrors: true
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

const getTraceData = async (url) => {
  const { context, close } = await getContext();

  const page = await context.newPage();

  const client = await page.target().createCDPSession();

  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');
  await client.send('Performance.enable');
  await client.send('Profiler.enable');

  await page.setViewport({ width: 1280, height: 720 });
  await page.tracing.start({});

  try {
    await page.goto(url, { timeout: 60000, waitUntil: ["load"] });

    const traceData = JSON.parse((await page.tracing.stop()).toString());

    await page.close();

    return traceData;
  } catch (e) {
    console.error(`Cannot get page ${url}:`, e);
  }

  await close();

  return null;
};
