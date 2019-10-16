const objMap = (obj = {}, map) => Object.entries(obj)
  .reduce((acc, [key, value]) => {
    acc[key] = map(value, key);

    return acc;
  }, {});

const objReduce = (obj = {}, reducer, inception = {}) => Object.entries(obj)
  .reduce((acc, [key, value]) => {
    const [newValue, newKey = key] = reducer(value, key);

    acc[newKey] = newValue;

    return acc;
  }, inception);

const objMake = (arr) => arr.reduce((acc, [key, value]) => {
  acc[key] = value;

  return acc;
}, {});

const objSumm = (obj1 = {}, obj2 = {}) => objMap(obj1, (value, key) => (value || 0) + (obj2[key] || 0));

const objConcat = (obj1 = {}, obj2 = {}) => objMap(
  obj1,
  (value, key) => value != null && obj2[key] != null ? [].concat(value, obj2[key]) : [value != null ? value : obj2[key]]
);

const objDivide = (obj = {}, divider) => objMap(obj, (value) => value / divider);

const objSub = (obj1 = {}, obj2 = {}) => objMap(obj1, (value, key) => (value || 0) - (obj2[key] || 0));

const objPercent = (obj1 = {}, obj2 = {}) => objMap(obj1,
  (value, key) => (value && obj2[key] ? ((value / obj2[key]) - 1) : 0)
);

const objFilter = (obj, filter) => Object.entries(obj).reduce((acc, [key, value]) => {
  if (filter(value, key)) {
    acc[key] = value;
  }

  return acc;
}, {});

const objDeepConcat = (obj1, obj2 = {}) => objMap(
  obj1,
  (innerObj, key) => Object.values(innerObj).every((value) => value instanceof Object) ? (
    objDeepConcat(innerObj, obj2[key])
  ) : (
    objConcat(innerObj, obj2[key])
  ));

const objDeepCompare = (comparator, obj1, obj2 = {}) => objMap(
  obj1,
  (innerObj, key) => Object.values(innerObj).every((value) => value instanceof Object) ? (
    objDeepCompare(comparator, innerObj, obj2[key])
  ) : (
    comparator(innerObj, obj2[key])
  ));

const asyncObjMap = async (obj, map) => {
  const results = await Promise.all(
    Object.entries(obj).map(async ([key, value]) => [key, await map(value, key)])
  );

  return objMake(results);
};

const objFill = (array) => array
  .reduce((acc, [path, value]) => (
    objDeepSet(acc, [path, value])
  ), {});

const objDeepSet = (obj, path, value) => {
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

const objDeepMap = (obj, map) => objMap(obj, (innerObj) =>
  Object.values(innerObj).every((value) => Array.isArray(value)) ? (
    map(innerObj)
  ) : (
    objDeepMap(innerObj)
  ));

module.exports = {
  objMap,
  objReduce,
  objDivide,
  objSumm,
  objConcat,
  objSub,
  objPercent,
  objFilter,
  objDeepConcat,
  objDeepCompare,
  asyncObjMap,
  objMake,
  objFill,
  objDeepSet,
  objDeepMap
};
