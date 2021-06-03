const urlRegExp = /^.*?\/([^/]+)\.(css|js)$/;

const hydrateRequestByType = (request) => {
  const { url, internal } = request;

  if (internal) {
    const [, hash] = url.match(urlRegExp) || [];

    return {
      ...request,
      hash
    }
  } else {
    return request;
  }
};

const flatConcatenatedModules = (modules) => [
  ...modules.filter(({ concatenated }) => !concatenated),
  ...modules
    .map(({ concatenated }) => concatenated)
    .filter(Boolean)
    .map(flatConcatenatedModules)
    .reduce((acc, arr) => acc.concat(arr), [])
];

const findModule = (modulesMaps, id, normalFirst) => normalFirst ? (
  modulesMaps.normal[id] || modulesMaps.concatenated[id]
) : (
  modulesMaps.concatenated[id] || modulesMaps.normal[id]
);

const extractModules = (modulesMaps, filesMap, modules, normalFirst) => (
  [...new Set(modules)]
    .map((id) => findModule(modulesMaps, id, normalFirst))
    .filter(Boolean)
    .map((module) => module.extractedFrom != null ? (
      findModule(modulesMaps, module.extractedFrom, normalFirst)
    ) : module)
    .map((module) => ({
      ...module,
      concatenated: module.type === 'ConcatenatedModule' ? (
        extractModules(modulesMaps, filesMap, module.concatenated || [], true)
      ) : null,
      reasons: module.reasons ? [...new Set(module.reasons.map(({ module }) => module))] : [],
      deps: module.deps ? [...new Set(module.deps.map(({ module }) => module))] : [],
      source: filesMap[module.file]
    }))
);

const makeChunkMetaBuilder = (request, modulesMap, filesMap) => (chunk) => ({
  ...chunk,
  modules: flatConcatenatedModules(extractModules(modulesMap, filesMap, chunk.modules))
});

const expandRequest = (request, build, modulesMaps, filesMap) => {
  const hydratedRequest = hydrateRequestByType(request);
  const makeChunkMeta = makeChunkMetaBuilder(hydratedRequest, modulesMaps, filesMap);

  if (hydratedRequest.internal && build && build.output) {
    const { hash } = hydratedRequest;
    const chunk = hash && build.output.chunks.find(({ files }) => files.some((path) => path.includes(hash)));

    if (chunk) {
      return {
        ...hydratedRequest,
        meta: makeChunkMeta(chunk)
      }
    } else {
      return hydratedRequest;
    }
  } else {
    return hydratedRequest;
  }
};

const expandNetwork = (network, build) => {
  const filesMap = build && build.input && makeMap(build.input.files, 'path');
  const modulesMaps = build && build.input && makeModulesMaps(build.input.modules);

  return build ? network
    .map((request) => expandRequest(request, build, modulesMaps, filesMap)) : network;
};

const makeModulesMaps = (allModules) => ({
  concatenated: makeMap(allModules.filter(({ type }) => type === 'ConcatenatedModule'), 'id'),
  normal: makeMap(allModules.filter(({ type }) => type !== 'ConcatenatedModule'), 'id')
});

const makeMap = (list, itemKey) => (
  list.reduce((acc, item) => {
    acc[item[itemKey]] = item;

    return acc;
  }, {})
);

module.exports = {
  expandNetwork
};
