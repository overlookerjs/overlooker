const map = (obj = {}, map) => Object.entries(obj)
  .reduce((acc, [key, value]) => {
    acc[key] = map(value, key);

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
  (value, key) => value != null && obj2[key] != null ? [].concat(value, obj2[key]) : [value != null ? value : obj2[key]]
);

const divide = (obj = {}, divider) => map(obj, (value) => value / divider);

const sub = (obj1 = {}, obj2 = {}) => map(obj1, (value, key) => (value || 0) - (obj2[key] || 0));

const percent = (obj1 = {}, obj2 = {}) => map(obj1,
  (value, key) => (value && obj2[key] ? ((value / obj2[key]) - 1) : 0)
);

const filter = (obj, filter) => Object.entries(obj).reduce((acc, [key, value]) => {
  if (filter(value, key)) {
    acc[key] = value;
  }

  return acc;
}, {});

const deepConcat = (obj1, obj2 = {}) => map(
  obj1,
  (innerObj, key) => Object.values(innerObj).every((value) => value instanceof Object) ? (
    deepConcat(innerObj, obj2[key])
  ) : (
    concat(innerObj, obj2[key])
  ));

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
      } else {
        return acc[key];
      }

      return acc;
    }, obj);

  return obj;
};

const deepMap = (obj, map) => map(obj, (innerObj) =>
  Object.values(innerObj).every((value) => Array.isArray(value)) ? (
    map(innerObj)
  ) : (
    deepMap(innerObj, map)
  ));

module.exports = {
  map,
  reduce,
  divide,
  summ,
  concat,
  sub,
  percent,
  filter,
  deepConcat,
  deepCompare,
  asyncMap,
  make,
  fill,
  deepSet,
  deepMap
};
