const {
  map,
  reduce,
  divide,
  summ,
  concat,
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
  toArray,
  expandFlat,
  makePath,
  keysExtend
} = require('../objects-utils.js');

describe('Object-utils unit tests', () => {
  const defaultInput = {
    a: 1,
    b: 2,
    c: 4
  };


  describe('map', () => {
    test('map with data', () => {
      const output = {
        a: '2a',
        b: '4b',
        c: '8c'
      };

      expect(map(defaultInput, (value, key) => value * 2 + key)).toStrictEqual(output);
    });

    test('map empty', () => {
      expect(map({})).toStrictEqual({});
    })
  });

  describe('reduce', () => {
    test('reduce without inception', () => {
      const output = {
        '1a': 'a',
        '2b': 'b',
        '4c': 'c'
      };

      expect(reduce(defaultInput, (value, key) => [key, value + key])).toStrictEqual(output);
    });

    test('reduce with inception', () => {
      const inception = { '6d': 'd' };
      const output = {
        '1a': 'a',
        '2b': 'b',
        '4c': 'c',
        '6d': 'd'
      };

      expect(reduce(defaultInput, (value, key) => [key, value + key], inception)).toStrictEqual(output);
    });

    test('reduce empty', () => {
      expect(reduce({})).toStrictEqual({});
    });
  });

  describe('divide', () => {
    test('divide with data', () => {
      const output = {
        a: 0.5,
        b: 1,
        c: 2
      };

      expect(divide(defaultInput, 2)).toStrictEqual(output);
    });

    test('divide empty', () => {
      expect(divide({}, 2)).toStrictEqual({});
    });
  });

  describe('summ', () => {
    test('summ with data', () => {
      const output = {
        a: 2,
        b: 4,
        c: 8
      };

      expect(summ(defaultInput, defaultInput)).toStrictEqual(output);
    });

    test('summ empty left', () => {
      expect(summ({}, defaultInput)).toStrictEqual({});
    });

    test('summ empty right', () => {
      expect(summ(defaultInput, {})).toStrictEqual(defaultInput);
    });
  });

  describe('concat', () => {
    test('concat with data', () => {
      const output = {
        a: [1, 1],
        b: [2, 2],
        c: [4, 4]
      };

      expect(concat(defaultInput, defaultInput)).toStrictEqual(output);
    });

    test('concat holey', () => {
      const output = {
        a: [1],
        b: [5],
        c: [4, 7]
      };
      expect(concat({
        a: 1,
        b: null,
        c: 4
      }, {
        a: null,
        b: 5,
        c: 7
      })).toStrictEqual(output);
    });
  });

  describe('filter', () => {
    test('filter with data', () => {
      const output = {
        b: 2,
        c: 4
      };

      expect(filter(defaultInput, (value, key) => value === 4 || key === 'b')).toStrictEqual(output);
    });

    test('filter empty', () => {
      expect(filter({})).toStrictEqual({});
    });
  });

  describe('filter', () => {
    test('filter with data', () => {
      const output = {
        b: 2,
        c: 4
      };

      expect(filter(defaultInput, (value, key) => value === 4 || key === 'b')).toStrictEqual(output);
    });
  });
});
