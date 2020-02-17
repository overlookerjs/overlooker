const escape = (number) => number > 9 ? number : `0${number}`;

const toTime = (date) => {
  const dateCopy = new Date(date);

  dateCopy.setHours(dateCopy.getHours() + dateCopy.getTimezoneOffset() / 60);

  return `${escape(dateCopy.getHours())}:${escape(dateCopy.getMinutes())}:${escape(dateCopy.getSeconds())}`
};

const toDate = (date) => {
  if (date instanceof Date) {
    return `${
      date.getFullYear()
    }.${
      escape(date.getMonth() + 1)
    }.${
      escape(date.getDate())
    } ${
      escape(date.getHours())
    }:${
      escape(date.getMinutes())
    }:${
      escape(date.getSeconds())
    }`;
  } else if (typeof date === 'number') {
    return toDate(new Date(date));
  } else {
    return date;
  }
};

const getDomain = (url) => {
  const match = url && url.match(/([^/.]+\.[^/.]+)(?:$|\/.*?$)/);

  return match && match[1];
};

const getHost = (url) => {
  const match = url && url.match(/^(https?:\/\/[^/]*?)\/?(?:$|\/.*?$)/);

  return match && match[1];
};

const urlJoin = (...urls) => urls.map((url) => url.replace(/(^\/)|(\/$)/g, '')).join('/');

const makeInternalTest = (page) => {
  const rule = new RegExp(`^https?:\/\/[^/]*${(getDomain(page) || '').replace('.', '\\.')}`);

  return (url) => rule.test(url);
};

const getExtension = (url) => {
  const match = url && url.match(/https?:\/\/[^/]*?\/.*?\.([a-zA-Z0-9]+)(?:\?.*?$|$)/);

  return match && match[1]
};

const getType = (file) => {
  const match = file.match(/\.([^?/]*?)(\?|$)/);

  return match && match[1];
};

const compareFileNames = (firstFile, secondFile) => {
  const firstNM = firstFile.startsWith('node_modules');
  const secondNM = secondFile.startsWith('node_modules');

  if ((firstNM && secondNM) || (!firstNM && !secondNM)) {
    return firstFile.localeCompare(secondFile);
  } else if (firstNM) {
    return 1;
  } else {
    return -1;
  }
};

const debounce = (fn, time = 1000, { start, end }) => {
  let timeout = null;

  return (...args) => {
    if (timeout) {
      clearTimeout(timeout);
    } else {
      start();
    }

    timeout = setTimeout(() => {
      fn(...args);
      end();
    }, time);
  }
};

const retry = (cb, task, timeout = 5000) => async (...args) => {
  let result;

  while (!result && (!task || task.status === 'running')) {
    try {
      result = await cb(...args);
    } catch (error) {
      if (task) {
        const response = error && error.response;
        const errorMessage = (
          response && response.data && (
            response.data.error && response.data.error.message ? (
              response.data.error.message
            ) : (
              response.data
            ))
        ) || (
          error && error.config && error.config.message
        );
        const host = (
          response && response.config && response.config.url
        ) || (
          error && error.config && error.config.url
        );

        task.progress(`${error.stack}\nhost: ${host}\n${errorMessage}`);
      }

      await new Promise((resolve) => setTimeout(resolve, timeout))
    }
  }

  return result;
};

const memoize = (fn) => {
  const map = [];

  return (...args) => {
    const [, similarResult] = map.find(([mapArgs]) => mapArgs.every((arg, index) => arg === args[index])) || [];

    if (similarResult) {
      return similarResult;
    } else {
      const result = fn(...args);

      map.push([args, result]);

      return result;
    }
  }
};

const makeRule = (rule) => {
  if (rule instanceof Function) {
    return rule;
  } else if (rule instanceof RegExp) {
    return (value) => rule.test(value);
  } else if (rule instanceof Array) {
    const rules = rule.map(makeRule);

    return (value) => rules.some((rule) => rule(value));
  } else if (typeof rule === 'string') {
    const regexp = new RegExp(rule);

    return (value) => regexp.test(value);
  } else {
    return undefined;
  }
};

const isRelativeUrl = (url) => !/^https?:\/\//.test(url);

const flat = (array) => Array.isArray(array) ? (
  array.reduce((acc, item) => acc.concat(flat(item)), [])
) : array;

module.exports = {
  escape,
  toTime,
  getDomain,
  getHost,
  getExtension,
  debounce,
  toDate,
  getType,
  compareFileNames,
  makeInternalTest,
  retry,
  isRelativeUrl,
  memoize,
  makeRule,
  flat,
  urlJoin
};
