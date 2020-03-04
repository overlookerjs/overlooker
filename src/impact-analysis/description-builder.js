const crypto = require('crypto');
const { make, map, filter } = require('./../objects-utils.js');
const cheerio = require('cheerio')

const hash = (string) => crypto
  .createHash('sha256')
  .update(string)
  .digest('hex');


const clearUrl = (url) => url && url.replace(/\?.*?$/, '');

const preRels = [
  'prefetch',
  'preload',
  'preconnect',
  'dns-prefetch',
  'prerender'
];

const getDeepestParent = (el) => {
  let parent = el;

  while (parent.name !== 'body' && parent.name !== 'head') {
    parent = parent.parent;
  }

  return parent;
};

const getUrl = (el) => {
  switch (el.type) {
    case 'link':
      return el.attributes.href;
    case 'script':
      return el.attributes.src;
    default:
      return null;
  }
};

const filterByIgnore = (ignore) => (el) => {
  const url = getUrl(el);

  return url ? !ignore(url) : true;
};

const replaceUrlInAttributes = (attributes, elementType, replacer) => {
  switch (elementType) {
    case 'link':
      return {
        ...attributes,
        href: replacer(attributes.href) || clearUrl(attributes.href)
      };
    case 'script':
      return {
        ...attributes,
        src: replacer(attributes.src) || clearUrl(attributes.src)
      };
  }
};

const replaceUrl = (replace) => (el) => ({
  ...el,
  attributes: replace ? replaceUrlInAttributes(el.attributes, el.type, replace) : el.attributes
});

const matchUrlToElement = (url, element) => {
  const elementUrl = getUrl(element);

  return url.endsWith(elementUrl) || url.startsWith(elementUrl);
};

const hydrateElementByRequest = (profile) => (el) => ({
  ...el,
  request: profile.network.find(({ url }) => matchUrlToElement(url, el)) || null
});

const parseElement = (el) => ({
  attributes: el.attribs,
  content: el.children
    .filter(({type}) => type === 'text')
    .map(({data}) => data)
    .join('\n'),
  type: el.name,
  location: getDeepestParent(el).name
});

const makeRequestHash = (request) => {
  const modules = request.meta && request.meta.modules;

  if (modules) {
    return hash(
      modules
        .filter(({ file }) => file)
        .sort((a, b) => a.file.localeCompare(b.file))
        .map(({ source }) => source.hash)
        .join('')
    );
  }

  return null;
};

const replaceRequestToModulesHash = (el) => ({
  ...el,
  modules: el.request ? makeRequestHash(el.request) : null,
  request: null
});

const hydrateByCommonHash = (el) => ({
  ...el,
  hash: hash(JSON.stringify({
    ...el,
    attributes: el.modules ? filter(
      el.attributes,
      (value, name) => name !== 'href' && name !== 'src'
    ) : el.attributes
  }))
});

const describeContent = (content, profile, elementsFilter = (el) => el, {
  merge,
  ignore = () => false
}) => {
  const $ = cheerio.load(content);

  const elements = Array.from($('script, link'))
    .map(parseElement)
    .filter(filterByIgnore(ignore))
    .map(replaceUrl(merge))
    .map(hydrateElementByRequest(profile))
    .filter(({
               request,
               content,
               type
             }) => request || content || type === 'LINK')
    .filter(elementsFilter)
    .map(replaceRequestToModulesHash)
    .map(hydrateByCommonHash);

  return {
    elements,
    hash: hash(elements.map(({ hash }) => hash).join(''))
  };
};

const describePage = ({ content, profile }, elementsFilter, requestsConfig) => ({
  load: describeContent(
    content.load,
    profile,
    (element) => elementsFilter(element, null),
    requestsConfig
  ),
  actions: map(
    content.actions,
    (actionContent, actionName) => describeContent(
      actionContent,
      profile.actions[actionName],
      (element) => elementsFilter(element, actionName),
      requestsConfig
    )
  )
});

const describePages = (profilesWithContent, config, elementsFilter = () => true) => map(
  profilesWithContent,
  (profileWithContent, pageName) => describePage(
    profileWithContent,
    (element, actionName) => elementsFilter(element, pageName, actionName),
    config.requests
  )
);

module.exports = {
  describePage,
  describePages
};
