const crypto = require('crypto');

const hash = (string) => crypto
  .createHash('sha256')
  .update(string)
  .digest('hex');

const { make, map } = require('./../objects-utils.js');
const { JSDOM } = require('jsdom');

const preRels = [
  'prefetch',
  'preload',
  'preconnect',
  'dns-prefetch',
  'prerender'
];

const getDeepestParent = (el) => {
  let parent = el;

  while (parent.tagName !== 'BODY' && parent.tagName !== 'HEAD') {
    parent = parent.parentNode;
  }

  return parent;
};

const getUrl = (el) => {
  switch (el.type) {
    case 'LINK':
      return el.attributes.href;
    case 'SCRIPT':
      return el.attributes.src;
    default:
      return null;
  }
};

const matchUrlToElement = (url, element) => {
  const elementUrl = getUrl(element);

  return url.endsWith(elementUrl) || url.startsWith(elementUrl);
};

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

const describeContent = (content, profile, elementsFilter = (el) => el) => {
  const dom = new JSDOM(content);

  const elements = Array.from(dom.window.document.querySelectorAll('script, link'))
    .map((el) => ({
      attributes: make(
        Array.from(el.attributes)
          .map((attr) => [attr.name, attr.value || true])
      ),
      content: el.innerHTML,
      type: el.tagName,
      location: getDeepestParent(el).tagName
    }))
    .map((el) => ({
      ...el,
      request: profile.network.find(({ url }) => matchUrlToElement(url, el)) || null
    }))
    .filter(({
               request,
               content,
               attributes: { rel }
             }) => request || content || preRels.includes(rel))
    .filter(elementsFilter)
    .map((el) => ({
      ...el,
      modules: el.request ? makeRequestHash(el.request) : null,
      request: null
    }))
    .map((el) => ({
      ...el,
      hash: hash(JSON.stringify({
        ...el,
        attributes: {
          ...el.attributes,
          href: null,
          src: null
        }
      }))
    }));

  return {
    elements,
    hash: hash(elements.map(({ hash }) => hash).join(''))
  };
};

const describePage = ({ content, profile }, elementsFilter) => ({
  load: describeContent(content.load, profile, elementsFilter),
  actions: map(
    content.actions,
    (actionContent, actionName) => describeContent(actionContent, profile.actions[actionName], elementsFilter)
  )
});

const describePages = (profilesWithContent, elementsFilter) => map(
  profilesWithContent,
  (profileWithContent) => describePage(profileWithContent, elementsFilter)
);

module.exports = {
  describePage,
  describePages
};
