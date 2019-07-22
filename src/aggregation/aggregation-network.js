const { makeEvaluatingMap } = require('../events/events-evaluating.js');
const { objDevide, objSumm, objConcat, objMap, memoize } = require('../utils.js');
const { objAggregation } = require('./aggregation-utils.js');

const clearUrl = (url) => url && url.replace(/\?.*?$/, '');

const getNetworkSummary = (network, inception = {}, merge, ignore) => {
  return network
    .reduce((networkSummary, {
      url,
      internal,
      timings,
      size,
      type,
      transfer
    }) => {
      const similarMergedUrl = url && merge(url);
      const isIgnored = url && ignore(url);
      const clearedUrl = similarMergedUrl || clearUrl(url);

      if (type !== 'Document' && !isIgnored) {
        if (networkSummary[clearedUrl]) {
          const similarSummary = networkSummary[clearedUrl];

          networkSummary[clearedUrl] = {
            size: size + similarSummary.size,
            transfer: transfer + similarSummary.transfer,
            timings: similarSummary.timings ? objSumm(similarSummary.timings, timings) : timings,
            count: similarSummary.count + 1,
            type,
            internal
          };
        } else {
          networkSummary[clearedUrl] = {
            url,
            internal,
            timings,
            size,
            type,
            transfer,
            count: 1
          };
        }
      }

      return networkSummary;
    }, inception);
};

const normalizeNetworkSummary = (summaryNetwork) => Object.entries(summaryNetwork)
  .map(([url, {
    internal,
    timings,
    size,
    type,
    transfer,
    count
  }]) => ({
    size: size / count,
    transfer: transfer / count,
    timings: objDevide(timings, count),
    type,
    url,
    count,
    internal
  }))
  .sort(({ size: fSize }, { size: sSize }) => sSize - fSize);

const urlRegExp = /^.*?\/([^/]+)\.(css|js)$/;

const hydrateRequestByType = (request) => {
  const { url, internal } = request;

  if (internal) {
    const [, hash, fileType] = url.match(urlRegExp) || [];

    return {
      ...request,
      hash,
      fileType
    }
  } else {
    return request;
  }
};

const extractModules = (modulesMap, filesMap, dependencies) => {
  return [...new Set(dependencies)]
    .map((id) => modulesMap[id])
    .filter(Boolean)
    .map((module) => module.extractedFrom != null ? (
      modulesMap[module.extractedFrom]
    ) : module)
    .map((module) => ({
      ...module,
      source: filesMap[module.file]
    }))
};

const makeChunkMetaBuilder = (request, modulesMap, filesMap) => (chunk, bundleInput) => ({
  ...chunk,
  bundle: bundleInput.bundlesBlocks.find(({ asset }) => chunk.name === asset),
  asset: bundleInput.assetsBlocks.find(({ hash }) => chunk.name === hash),
  modules: extractModules(modulesMap, filesMap, chunk.modules)
});

const expandRequest = (request, build) => {
  const modulesMap = makeMap(build, 'modules', 'id');
  const filesMap = makeMap(build, 'files', 'path');
  const hydratedRequest = hydrateRequestByType(request);
  const makeChunkMeta = makeChunkMetaBuilder(hydratedRequest, modulesMap, filesMap);

  if (hydratedRequest.internal && build && build.output) {
    const { hash } = hydratedRequest;
    const chunk = hash && build.output.chunks.find(({ files }) => files.some((path) => path.includes(hash)));

    if (chunk) {
      return {
        ...hydratedRequest,
        meta: makeChunkMeta(
          chunk,
          build.input
        )
      }
    } else {
      return hydratedRequest;
    }
  } else {
    return hydratedRequest;
  }
};

const expandNetwork = (network, build) => {
  return network
    .map((request) => expandRequest(request, build));
};

const makeMap = memoize((build, inputKey, itemKey) => {
  const list = build && build.input ? build.input[inputKey] : [];

  return list.reduce((acc, item) => {
    acc[item[itemKey]] = item;

    return acc;
  }, {});
});

const normalizeEvaluatingSummary = (evaluatings = []) => {
  const clearEvaluating = evaluatings
    .filter(Boolean);

  return clearEvaluating && clearEvaluating.length ? (
    Array(clearEvaluating[0].length)
      .fill(null)
      .map((i, index) => clearEvaluating.map((evaluating) => evaluating[index]))
      .map((mergedEvaluating) => ({
        url: mergedEvaluating[0].url,
        duration: mergedEvaluating
          .reduce((acc, { duration = 0 } = {}) => acc + duration, 0) / mergedEvaluating.length,
        timings: objDevide(
          mergedEvaluating
            .filter(Boolean)
            .map(({ timings }) => timings)
            .reduce(objSumm),
          mergedEvaluating.length
        )
      }))
  ) : (
    []
  );
};

const getEvaluatingSummary = (evaluating, summaryEvaluating) => Object.entries(evaluating)
  .reduce((acc, [key, value]) => {
    if (!acc[key]) {
      acc[key] = [value];
    } else {
      acc[key].push(value);
    }

    return acc;
  }, summaryEvaluating);

const getAggregatedStats = (profiles, merge, ignore) => {
  const {stats, network, evaluating} = profiles.reduce((summary, profile) => ({
    stats: objMap(profile.stats, (innerObj, key) => objConcat(innerObj, summary.stats[key])),
    network: getNetworkSummary(profile.network, summary.network, merge, ignore),
    evaluating: getEvaluatingSummary(profile.evaluating, summary.evaluating)
  }), {
    stats: {},
    network: {},
    evaluating: {}
  });

  return {
    stats: objMap(stats, (innerObj) => objAggregation(innerObj)),
    network: normalizeNetworkSummary(network),
    evaluating: normalizeEvaluatingSummary(evaluating)
  };
};

module.exports = {
  getAggregatedStats
};
