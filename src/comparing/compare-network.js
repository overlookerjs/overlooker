const { getType, map } = require('./../objects-utils.js');

const COMPARING_MODULES_THRESHOLD = 0.5;

const clearUrl = (request) => ({
  ...request,
  clearedUrl: request.url.replace(/\?.*?$/, '')
});

const getPathnameWithQuery = (url = '') => {
  const match = url.match(/^https?:\/\/.*?(\/.*?$)/);

  return match && match[1];
};

const compareUrls = (firstRequest, secondRequest) => {
  if (firstRequest.internal && secondRequest.internal) {
    return getPathnameWithQuery(firstRequest.url) === getPathnameWithQuery(secondRequest.url);
  } else {
    return firstRequest.url === secondRequest.url;
  }
};

const findSimilarExpandedRequest = (request, network) => {
  const similarByUrl = network.find((networkRequest) => compareUrls(request, networkRequest));

  if (similarByUrl) {
    return similarByUrl;
  }

  if (request.meta && request.meta.modules) {
    if (request.meta.bundle) {
      const { name } = request.meta.bundle;
      const similarByBundle = network.find(({ meta, url }) => (
        meta && meta.bundle && meta.bundle.name === name
      ) && (
        getType(url) === getType(request.url)
      ));

      if (similarByBundle) {
        return similarByBundle;
      }
    }

    const requestModules = request.meta.modules.map(({ file }) => file);

    const extractedModulesWithRequests = network.map((comparedRequest) => (
      (comparedRequest.meta && comparedRequest.meta.modules) ? (
        [comparedRequest, comparedRequest.meta.modules]
      ) : (
        [comparedRequest, []]
      )
    ));

    const similarsByModules = extractedModulesWithRequests
      .map(([comparedRequest, modules]) => {
        const rate = modules.length / requestModules.length;
        const similarity = (
          modules && modules.length && (
            modules.filter((module) => requestModules
              .includes(module.file)).length / modules.length
          )
        );

        return { comparedRequest, similarity, rate };
      })
      .filter(({ comparedRequest, similarity, rate }) => (
        getType(comparedRequest.url) === getType(request.url)
      ) && (
        similarity > COMPARING_MODULES_THRESHOLD
      ) && (
        rate > 0.5 && rate < 1.5
      ))
      .sort(({ similarity: sf }, { similarity: ss }) => ss - sf);

    if (similarsByModules.length === 1) {
      return similarsByModules[0].comparedRequest;
    } else {
      const similar = similarsByModules.find(({ similarity }) => similarity === 1);

      return similar ? similar.comparedRequest : null;
    }
  }

  return null;
};

const findSimilarsRequests = (firstNetwork, secondNetwork) => {
  const intersection = firstNetwork
    .map((request) => [request, findSimilarExpandedRequest(request, secondNetwork)]);

  const firstDifference = intersection
    .filter(([, interRequest]) => !interRequest);

  const secondDifference = secondNetwork
    .filter((request) => !intersection.some(([, interRequest]) => interRequest === request))
    .map((request) => [null, request]);

  const clearedIntersection = intersection
    .filter(([, request]) => request);

  return [...firstDifference, ...clearedIntersection, ...secondDifference];
};

const getRequestsDiff = (first, second) => ({
  ...(first || {}),
  ...(second || {}),
  ...(first && second ? {
    size: second.size - first.size,
    transfer: second.transfer - first.transfer,
    timings: map(first.timings, (value, key) => second.timings[key] - value),
    evaluating: second.evaluating.map((secondEval, index) => ({
      url: secondEval.url,
      duration: secondEval - (first.evaluating[index] ? first.evaluating[index].duration : 0),
      timings: map(secondEval, (value, key) => first.evaluating[index] ? (
        value - first.evaluating[index].timings[key]
      ) : value)
    })),
    coverage: second.coverage && first.coverage ? {
      total: second.coverage.total - first.coverage.total,
      used: second.coverage.used - first.coverage.used,
      ranges: second.coverage.ranges
        .filter(({ start, end }) => !first.coverage.ranges
          .some((range) => range.start === start && range.end === end))
    } : null
  } : {})
});

const compareNetworks = (firstNetwork, secondNetwork) => {
  return findSimilarsRequests(firstNetwork, secondNetwork)
    .map(([first, second]) => {
      if ((first && !second) || (!first && second)) {
        return {
          requests: [first || null, second || null],
          difference: getRequestsDiff(first || null, second || null),
          fileStatus: first ? 'lose' : 'added'
        };
      } else {
        const isNotChanged = (
          first.source
          && first.source.hash
          && second.source
          && second.source.hash
          && first.source.hash === second.source.hash
        ) || (
          getPathnameWithQuery(first.url) === getPathnameWithQuery(second.url)
        );
        const firstModules = first.meta && first.meta.modules && first.meta.modules;
        const secondModules = second.meta && second.meta.modules && second.meta.modules;
        const isContentNotChanged = firstModules && secondModules ? (
          firstModules.length === secondModules.length
        ) && (
          firstModules.every(({ source }) => secondModules.some((module) => (
            module.source && source && module.source.hash === source.hash
          )))
        ) : (
          first.size === second.size
        );

        return {
          requests: [first, second],
          difference: getRequestsDiff(first, second),
          fileStatus: isNotChanged ? 'not_changed' : 'changed',
          contentStatus: isContentNotChanged ? 'not_changed' : 'changed',
          modules: first.meta && second.meta && first.meta.modules && second.meta.modules ? (
            compareChunks(first, second)
          ) : null
        }
      }
    });
};

const compareChunks = (firstRequest, secondRequest) => {
  const plainModulesLeft = firstRequest.meta.modules;
  const plainModulesRight = secondRequest.meta.modules;

  const similar = plainModulesLeft.filter(({ source }) => plainModulesRight
    .some((module) => module.source && source && module.source.hash === source.hash));
  const changed = plainModulesRight.filter(({ source, file }) => plainModulesLeft
    .some((module) => module.file === file && module.source && source && module.source.hash !== source.hash));
  const added = plainModulesRight.filter(({ file }) => plainModulesLeft
    .every((module) => module.file !== file));
  const removed = plainModulesLeft.filter(({ file }) => plainModulesRight
    .every((module) => module.file !== file));

  return {
    similar,
    changed,
    added,
    removed
  };
};

module.exports = {
  compareChunks,
  compareNetworks
};
