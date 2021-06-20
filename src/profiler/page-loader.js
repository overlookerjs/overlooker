const networkPresets = require('../network-presets.js');
const {
  injectElementTimingObserver,
  getElementsTimings,
  injectElementTimingHandler,
  getPaintEventsBySelectors,
  waitForElementTiming
} = require('./hero-elements.js');
const { filter } = require('./../objects-utils.js');
const { injectLongTasksObserver, getTti } = require('./tti.js');
const { watch } = require('./watching.js');
const { ACTION_START, ACTION_END } = require('./../constants.js');
const { make } = require('./../objects-utils.js');
const { devices, viewports } = require('./viewports.js');
const { RequestsTracker } = require('./requests-tracker.js');
const cache = require('./cache.js');
const { hash, CacheBandwidth } = require('./cache-bandwidth.js');

const interceptFinishedRequest = async (postDataHandler, logger, interceptedRequest) => {
  if (interceptedRequest.method() === 'POST') {
    const url = interceptedRequest.url();
    const postData = postDataHandler(url, interceptedRequest.postData());
    const key = url + postData;

    const cachedObject = cache.has(key);

    if (!cachedObject) {
      try {
        const response = interceptedRequest.response();

        const body = await response.text();
        const headers = response.headers();
        const status = response.status();

        const data = {
          body,
          headers,
          status,
          contentType: headers['content-type']
        };

        cache.set(key, data);
      } catch (e) {
        logger(e.stack);
      }
    }
  }
}

const interceptRequest = async (config, isProxyCache, responseDataHandler, postDataHandler, logger, interceptedRequest, route) => {
  const url = interceptedRequest.url();

  if (config.requests && config.requests.ignore && config.requests.ignore(url)) {
    try {
      await (route || interceptedRequest).abort();
    } catch (e) {
      logger(e.stack);
    }

    return;
  }

  if (isProxyCache && interceptedRequest.method() === 'POST') {
    const rawPostData = interceptedRequest.postData();
    const postData = postDataHandler(url, rawPostData);
    const cachedObject = cache.get(url + postData);

    if (cachedObject) {
      const preparedBody = responseDataHandler(url, rawPostData, cachedObject.body);

      setTimeout(async () => {
        try {
          await (route && route.fulfill || interceptedRequest.respond)({
            ...cachedObject,
            body: preparedBody
          });
        } catch (e) {
          logger(e.stack);

          await (route || interceptedRequest).continue();
        }
      }, 500);

      return;
    }
  }

  try {
    await (route || interceptedRequest).continue();
  } catch (e) {
    logger(e.stack);
  }
}

const setupPageConfig = async (context, page, client, config, pageConfig, cacheBandwidth) => {
  const { logger, throttling, isPlaywright } = config;

  if (!isPlaywright) {
    if (config.platform === 'mobile') {
      await page.emulate(devices.mobile);
    } else {
      await page.setViewport(viewports.desktop);
    }
  }

  if (throttling) {
    if (throttling.network) {
      await client.send('Network.emulateNetworkConditions', networkPresets[throttling.network]);
    }

    if (throttling.cpu) {
      await client.send('Emulation.setCPUThrottlingRate', { rate: throttling.cpu });
    }
  }

  if (config.cookies || pageConfig.cookies) {
    const cookies = []
      .concat(config.cookies || [])
      .concat(pageConfig.cookies || []);

    if (cookies && cookies.length) {
      await Promise.all(cookies.map((cookie) => client.send('Network.setCookie', cookie)));
    }
  }

  const isProxyCache = config.cache && config.cache.type === 'proxy';
  const isSyntheticCache = config.cache && config.cache.type === 'synthetic';

  const postDataHandler = isProxyCache && config.cache.postDataHandler ? (
    new Function('return ' + config.cache.postDataHandler)()
  ) : (
    (url, postData) => postData
  )
  const responseDataHandler = isProxyCache && config.cache.responseDataHandler ? (
    new Function('return ' + config.cache.responseDataHandler)()
  ) : (
    (url, postData, response) => response
  )

  if (!isSyntheticCache) {
    if (config.isPlaywright) {
      page.route(/.*/, (route, request) => interceptRequest(config, isProxyCache, responseDataHandler, postDataHandler, logger, request, route));
    } else {
      page.on('request', (request) => interceptRequest(config, isProxyCache, responseDataHandler, postDataHandler, logger, request));
    }

    if (isProxyCache) {
      if (config.isPlaywright) {
        page.on('requestfinished', (route, request) => interceptFinishedRequest(postDataHandler, logger, request));
      } else {
        page.on('requestfinished', (request) => interceptFinishedRequest(postDataHandler, logger, request));
      }
    }
  }

  if (isSyntheticCache) {
    const requestsMap = new Map();
    await client.send('Network.enable');

    if (cacheBandwidth.writeMode) {
      client.on('Network.requestWillBeSent', async (event) => {
        if (config.requests && config.requests.ignore && config.requests.ignore(event.request.url)) {
          try {
            await client.send('Network.continueInterceptedRequest', {
              interceptionId: event.requestId,
              errorReason: 'Aborted'
            });
          } catch (e) {

          }
        } else {
          requestsMap.set(event.requestId, {
            method: event.request.method,
            priority: event.request.initialPriority,
            url: event.request.url
          });
        }
      });

      client.on('Network.responseReceived', (event) => {
        const request = requestsMap.get(event.requestId);

        if (request) {
          request.headers = event.response.headers;
          request.status = event.response.status;
          request.contentType = event.response.headers['content-type'] || event.response.mimeType;
          request.mimeType = event.response.mimeType;
        }
      });

      client.on('Network.loadingFinished', async (event) => {
        const request = requestsMap.get(event.requestId);

        if (request) {
          try {
            const rawPostData = request.method !== 'GET' ? await client.send('Network.getRequestPostData', { requestId: event.requestId }) : '';
            const postData = postDataHandler(
              request.url,
              rawPostData
            );
            const {
              body,
              base64Encoded
            } = await client.send('Network.getResponseBody', { requestId: event.requestId });

            const handledBody = responseDataHandler(request.url, rawPostData, body);

            request.size = event.encodedDataLength;
            request.postData = postData;
            request.body = base64Encoded ? handledBody : Buffer.from(handledBody).toString('base64');

            const key = hash(request.url + request.postData);

            if (!cacheBandwidth.has(key)) {
              cacheBandwidth.set(key, request);
            }
          } catch (e) {

          }
        }
      });
    } else if (cacheBandwidth.replayMode) {
      await client.send('Fetch.enable', {
        patterns: [{
          urlPattern: '*',
        }]
      });

      client.on('Network.requestWillBeSent', async (event) => {
        try {
          const url = event.request.url;
          const postData = postDataHandler(
            url,
            event.request.method !== 'GET' ? await client.send('Network.getRequestPostData', { requestId: event.requestId }) : ''
          );

          requestsMap.set(event.requestId, hash(url + (postData || '')));
        } catch (e) {

        }
      });

      client.on('Network.resourceChangedPriority', async (event) => {
        const key = requestsMap.get(event.requestId);

        if (key) {
          cacheBandwidth.changePriority(key, event.newPriority);
        }
      });

      client.on('Fetch.requestPaused', async ({ requestId, request }) => {
        const url = request.url;
        const postData = request.postData;
        const key = hash(url + (postData || ''));

        const hasCachedRequest = cacheBandwidth.has(key);

        if (config.requests && config.requests.ignore && config.requests.ignore(url)) {
          client.send('Fetch.failRequest', { requestId, errorReason: 'Aborted' });
        } else if (hasCachedRequest) {
          cacheBandwidth.get(key)
            .then(async (data) => {
              const headers = {};

              if (data.contentType)
                headers['content-type'] = data.contentType;
              if (data.body && !('content-length' in data.headers))
                headers['content-length'] = String(Buffer.byteLength(Buffer.from(data.body, 'base64')));

              try {
                await client.send('Fetch.fulfillRequest', {
                  requestId,
                  responseCode: data.status,
                  responseHeaders: Object.entries(headers).map(([name, value]) => ({ name, value })),
                  body: data.body
                });
              } catch (e) {
              }
            });
        } else {
          try {
            await client.send('Fetch.continueRequest', { requestId });
          } catch (e) {
          }
        }
      });
    }
  }
};

const profileActions = async (context, page, client, config, pageConfig) => {
  const res = {};
  const { logger } = config;
  const pages = make(config.pages.map(({ name, url }) => [name, url]));

  if (pageConfig.actions && pageConfig.actions.length) {
    for (const { name, action, layers } of pageConfig.actions) {
      await logger(`action "${name}" started`);

      const getWatchingResult = await watch(context, page, config.isPlaywright);

      /* istanbul ignore next */
      await page.evaluate((as) => window.performance.mark(as), ACTION_START);
      await action(page, pages, {
        waitForElementTiming
      });
      /* istanbul ignore next */
      await page.evaluate((ae) => window.performance.mark(ae), ACTION_END);

      const content = await page.content();

      const watchingResult = await getWatchingResult();

      const layersPaints = await getPaintEventsBySelectors(client, watchingResult.tracing, layers);
      const elementsTimings = await getElementsTimings(page);

      res[name] = {
        ...watchingResult,
        elementsTimings,
        layersPaints,
        content
      };

      await logger(`action "${name}" completed`);
    }
  }

  return res;
};

const loadPage = async (context, config, pageConfig, cacheBandwidthConfig) => {
  const { url, layers } = pageConfig;
  const cacheBandwidth = cacheBandwidthConfig ? new CacheBandwidth(cacheBandwidthConfig.throughput, cacheBandwidthConfig.latency) : null;

  if (cacheBandwidthConfig) {
    if (cacheBandwidthConfig.writeMode) {
      cacheBandwidth.write();
    } else {
      cacheBandwidth.setCache(cacheBandwidthConfig.resources);
      cacheBandwidth.replay();
    }
  }

  const page = await context.newPage();
  let getWatchingResult;

  try {
    const client = config.isPlaywright ? await page.context().newCDPSession(page) : await page.target().createCDPSession();

    await client.send('Network.clearBrowserCache');
    await client.send('Network.clearBrowserCookies');
    await client.send('Profiler.enable');

    await setupPageConfig(context, page, client, config, pageConfig, cacheBandwidth);

    getWatchingResult = await watch(context, page, config.isPlaywright, Boolean(cacheBandwidth));

    await injectLongTasksObserver(page, config.isPlaywright);
    await injectElementTimingObserver(page, config.isPlaywright);

    const tracker = new RequestsTracker();
    tracker.init(page);

    if (cacheBandwidth) {
      cacheBandwidth.start();
    }

    const pageResponse = await page.goto(url, { timeout: 45000, waitUntil: ['load', 'networkidle0'] }).catch((e) => {
      const { failed, inflight } = tracker.getRequests();

      tracker.dispose(page);

      throw new Error(`${e.message}\n\nInflight requests:\n${inflight.join('\n')}\n\nFailed requests:\n${failed.join('\n')}`);
    });

    const pageStatus = pageResponse.status();

    if (pageStatus >= 400) {
      throw new Error(`Page loading failed with status code: ${pageStatus}`);
    }

    tracker.dispose(page);

    const watchingResult = await getWatchingResult();
    getWatchingResult = null;
    const timeToInteractive = await getTti(page, config.logger, config.firstEvent);

    const content = await page.content();

    const layersPaints = await getPaintEventsBySelectors(client, watchingResult.tracing, layers);

    await injectElementTimingHandler(page);
    const elementsTimings = await getElementsTimings(page, config.isPlaywright);

    const actions = await profileActions(context, page, client, config, pageConfig);

    if (cacheBandwidth) {
      cacheBandwidth.stop();
    }

    await page.close();

    const cacheRequests = cacheBandwidth ? cacheBandwidth.getCache() : null;
    const cacheLog = cacheBandwidth ? cacheBandwidth.getLogs() : null;

    return {
      ...watchingResult,
      content,
      actions,
      timeToInteractive,
      layersPaints,
      elementsTimings,
      cacheRequests,
      cacheLog
    };
  } catch (error) {
    if (getWatchingResult) {
      await getWatchingResult();
    }

    if (cacheBandwidth) {
      cacheBandwidth.stop();
    }

    await page.close();

    throw error;
  }
};

module.exports = {
  loadPage
};
