const { inverseSub } = require('../math-utils.js');
const { map, deepCompare } = require('./../objects-utils.js');
const { getType } = require('./../utils.js');

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
    if (!request.meta.modules.length) {
      const { name } = request.meta;
      const similarByBundle = network.find(({ meta, extension }) => (
        meta && meta.name === name
      ) && (
        extension === request.extension
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
        comparedRequest.extension === request.extension
      ) && (
        similarity > COMPARING_MODULES_THRESHOLD
      ) && (
        rate > 0.5 && rate < 1.5
      ))
      .sort(({ similarity: sf }, { similarity: ss }) => ss - sf);

    const fullSimilarity = similarsByModules.find(({ similarity }) => similarity === 1);

    if (fullSimilarity) {
      return fullSimilarity.comparedRequest;
    } else if (similarsByModules.length > 1) {
      return similarsByModules[0].comparedRequest;
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
  stats: deepCompare(inverseSub, first ? first.stats : undefined, second ? second.stats : undefined),
  ...(first && second ? {
    evaluation: second.evaluation.map((secondEval, index) => ({
      url: secondEval.url,
      duration: secondEval - (first.evaluation[index] ? first.evaluation[index].duration : 0),
      timings: map(secondEval, (value, key) => first.evaluation[index] ? (
        value - first.evaluation[index].timings[key]
      ) : value)
    }))
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
            compareModules(first.meta.modules, second.meta.modules)
          ) : null
        }
      }
    });
};

const compareModules = (plainModulesLeft, plainModulesRight) => {
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
  compareModules,
  compareNetworks
};
