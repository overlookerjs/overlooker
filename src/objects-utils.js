const map = (obj = {}, mapper) => Object.entries(obj)
  .reduce((acc, [key, value]) => {
    acc[key] = mapper(value, key);

    return acc;
  }, {});

const reduce = (obj = {}, reducer, inception = {}) => Object.entries(obj)
  .reduce((acc, [key, value]) => {
    const [newValue, newKey = key] = reducer(value, key);

    acc[newKey] = newValue;

    return acc;
  }, inception);

const make = (arr) => arr.reduce((acc, [key, value]) => {
  acc[key] = value;

  return acc;
}, {});

const summ = (obj1 = {}, obj2 = {}) => map(obj1, (value, key) => (value || 0) + (obj2[key] || 0));

const concat = (obj1 = {}, obj2 = {}) => map(
  obj1,
  (value, key) => value != null && obj2[key] != null ? (
    [].concat(value, obj2[key])
  ) : (
    [value != null ? value : obj2[key]]
  )
);

const divide = (obj = {}, divider) => map(obj, (value) => value / divider);

const sub = (obj1 = {}, obj2 = {}) => map(obj1, (value, key) => (value || 0) - (obj2[key] || 0));

const inverseSub = (obj1, obj2) => sub(obj2, obj1);

const percent = (obj1 = {}, obj2 = {}) => map(obj1,
  (value, key) => (value && obj2[key] ? ((value / obj2[key]) - 1) : 0)
);

const inversePercent = (obj1, obj2) => percent(obj2, obj1);

const filter = (obj, filter) => Object.entries(obj).reduce((acc, [key, value]) => {
  if (filter(value, key)) {
    acc[key] = value;
  }

  return acc;
}, {});

const deepConcat = (obj1 = {}, obj2 = {}) => map({
    ...map(obj2, (value) => value instanceof Object && !Array.isArray(value) ? {} : undefined), // ToDo: rework?
    ...obj1
  },
  (innerObj, key) => innerObj instanceof Object && !Array.isArray(innerObj) ? (
    Object.keys(innerObj).length ? deepConcat(innerObj, obj2[key]) : deepConcat(obj2[key])
  ) : (
    []
      .concat(innerObj !== undefined ? innerObj : [])
      .concat(obj2[key] !== undefined ? obj2[key] : [])
  )
);

const deepCompare = (comparator, obj1, obj2 = {}) => map(
  obj1,
  (innerObj, key) => Object.values(innerObj).every((value) => value instanceof Object) ? (
    deepCompare(comparator, innerObj, obj2[key])
  ) : (
    comparator(innerObj, obj2[key])
  ));

const asyncMap = async (obj, map) => {
  const results = await Promise.all(
    Object.entries(obj).map(async ([key, value]) => [key, await map(value, key)])
  );

  return make(results);
};

const fill = (array) => array
  .reduce((acc, [path, value]) => (
    deepSet(acc, path, value)
  ), {});

const deepSet = (obj, path, value) => {
  path
    .reduce((acc, key, index) => {
      if (index === path.length - 1) {
        acc[key] = value;
      } else if (!acc[key]) {
        acc[key] = {};
      }

      return acc[key];
    }, obj);

  return obj;
};

const deepMapUntilArray = (obj, mapper) => map(obj, (innerObj) =>
  Object.values(innerObj).every((value) => Array.isArray(value)) ? (
    mapper(innerObj)
  ) : (
    deepMapUntilArray(innerObj, mapper)
  ));

const deepMap = (obj, mapper) => map(obj, (innerObj, key) =>
  innerObj instanceof Object && !Array.isArray(innerObj) ? (
    deepMap(innerObj, mapper)
  ) : (
    mapper(innerObj, key)
  ));

const toArray = (obj, skipSymbols = [], parent = '', acc = []) => (
  Object.entries(obj)
    .reduce((acc, [key, value]) => {
      const complexKey = parent ? parent + '.' + key : key;

      if (skipSymbols.includes(complexKey)) {
        acc.push([complexKey, flat(value, skipSymbols.filter((symbol) => symbol === complexKey))]);
      } else if (value instanceof Object) {
        toArray(value, skipSymbols, complexKey, acc);
      } else {
        acc.push([complexKey, value]);
      }

      return acc;
    }, acc)
);

const flat = (obj, skipSymbols) => make(toArray(obj, skipSymbols));

const addPrefix = (obj, prefix) => Object.entries(obj)
  .reduce((acc, [key, value]) => {
    acc[prefix + key] = value;

    return acc;
  }, {});

const raiseFields = (obj, symbols) => Object.entries(obj)
  .reduce((acc, [key, value]) => {
    if (symbols.includes(key)) {
      Object.assign(acc, addPrefix(value, key + '.'));
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});

const getByPath = (obj, path) => (Array.isArray(path) ? path : path.split('.'))
  .reduce((acc, key) => acc[key], obj);

module.exports = {
  map,
  reduce,
  divide,
  summ,
  concat,
  sub,
  inverseSub,
  percent,
  inversePercent,
  filter,
  deepConcat,
  deepCompare,
  asyncMap,
  make,
  fill,
  deepSet,
  deepMap,
  deepMapUntilArray,
  flat,
  raiseFields,
  addPrefix,
  getByPath,
  toArray
};
