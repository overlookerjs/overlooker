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

  describe('deepConcat', () => {
    const inputFull = {
      a: {
        b: 1,
        c: {
          e: 2,
          f: [3, 5]
        }
      },
      d: 4
    };
    const inputHoley = {
      a: {
        b: 1
      }
    };
    const outputFull = {
      a: {
        b: [1, 1],
        c: {
          e: [2, 2],
          f: [3, 5, 3, 5]
        }
      },
      d: [4, 4]
    };
    const outputHoley = {
      a: {
        b: [1, 1],
        c: {
          e: [2],
          f: [3, 5]
        }
      },
      d: [4]
    };
    const outputOneEmpty = {
      a: {
        b: [1],
        c: {
          e: [2],
          f: [3, 5]
        }
      },
      d: [4]
    };

    test('deepConcat full data', () => {
      expect(deepConcat(inputFull, inputFull)).toStrictEqual(outputFull);
    });

    test('deepConcat holey data left', () => {
      expect(deepConcat(inputHoley, inputFull)).toStrictEqual(outputHoley);
    });

    test('deepConcat holey data right', () => {
      expect(deepConcat(inputFull, inputHoley)).toStrictEqual(outputHoley);
    });

    test('deepConcat empty data', () => {
      expect(deepConcat({}, {})).toStrictEqual({});
    });

    test('deepConcat empty data left', () => {
      expect(deepConcat({}, inputFull)).toStrictEqual(outputOneEmpty);
    });

    test('deepConcat empty data right', () => {
      expect(deepConcat(inputFull, {})).toStrictEqual(outputOneEmpty);
    });
  });

  describe('deepCompare', () => {
    const comparator = (a, b) => Array.isArray(a) || Array.isArray(b) ? (
      (a || Array(b.length).fill(null)).map((i, index) => (b && b[index] || 0) - (i || 0))
    ) : (b || 0) - (a || 0);
    const inputFullFirst = {
      a: {
        b: 3,
        c: {
          e: 2,
          f: [3, 5]
        }
      },
      d: 4
    };
    const inputFullSecond = {
      a: {
        b: 1,
        c: {
          e: 7,
          f: [4, 8]
        }
      },
      d: 1
    };
    const outputFull = {
      a: {
        b: -2,
        c: {
          e: 5,
          f: [1, 3]
        }
      },
      d: -3
    };
    const inputHoley = {
      a: {
        b: 1,
        c: {
          f: [1]
        }
      }
    };
    const outputHoleyLeft = {
      a: {
        b: 2,
        c: {
          e: 2,
          f: [2]
        }
      },
      d: 4
    };
    const outputHoleyRight = {
      a: {
        b: -2,
        c: {
          e: -2,
          f: [-2, -5]
        }
      },
      d: -4
    };
    const outputEmpty = {
      a: {
        b: -3,
        c: {
          e: -2,
          f: [-3, -5]
        }
      },
      d: -4
    };

    test('deepConcat full data', () => {
      expect(deepCompare(comparator, inputFullFirst, inputFullSecond)).toStrictEqual(outputFull);
    });

    test('deepConcat holey data left', () => {
      expect(deepCompare(comparator, inputHoley, inputFullFirst)).toStrictEqual(outputHoleyLeft);
    });

    test('deepConcat holey data right', () => {
      expect(deepCompare(comparator, inputFullFirst, inputHoley)).toStrictEqual(outputHoleyRight);
    });

    test('deepConcat empty data', () => {
      expect(deepCompare(comparator, {}, {})).toStrictEqual({});
    });

    test('deepConcat empty data left', () => {
      expect(deepCompare(comparator, {}, inputFullFirst)).toStrictEqual(inputFullFirst);
    });

    test('deepConcat empty data right', () => {
      expect(deepCompare(comparator, inputFullFirst, {})).toStrictEqual(outputEmpty);
    });
  });
});
