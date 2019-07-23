const { memoize } = require('../utils.js');

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
  return build ? network
    .map((request) => expandRequest(request, build)) : network;
};

const makeMap = memoize((build, inputKey, itemKey) => {
  const list = build && build.input ? build.input[inputKey] : [];

  return list.reduce((acc, item) => {
    acc[item[itemKey]] = item;

    return acc;
  }, {});
});

module.exports = {
  expandNetwork
};
