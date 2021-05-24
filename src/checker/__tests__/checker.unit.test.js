const { check, checkPages } = require('./../check.js');

expect.extend({
  toBeValid(received, thr, path, value) {
    if (!received || received.path !== path || received.value !== value) {
      return {
        message: () => `pattern ${thr} expanded to path ${path} with value ${value} not found in results`,
        pass: false
      };
    } else {
      return {
        message: () => `pattern ${thr} expanded to path ${path} with value ${value} found in results`,
        pass: true
      };
    }
  }
});

describe('Checker unit tests', () => {
  test('Check patterns', async () => {
    const checkedObject = {
      foo: 1,
      bar: 2,
      baz: {
        a: 3,
        y: {
          r: {
            m: {
              n: {
                q: 10
              }
            },
            o: 11
          }
        },
        d: 16,
        z: {
          c: {
            n: {
              m: {
                q: 12
              }
            }
          }
        },
        b: {
          c: {
            d: 4,
            l: 13
          },
          e: 5
        },
        f: {
          d: {
            l: 14,
            g: 6
          },
          e: 8
        },
        j: {
          d: 7
        }
      }
    };
    const thresholdsWithResults = {
      'foo': [["foo", 1]],
      'baz.a': [["baz.a", 3]],
      'baz.**.{d, k}': [["baz.b.c.d", 4], ["baz.j.d", 7]],
      'baz.*.e': [["baz.b.e", 5], ["baz.f.e", 8]],
      'baz.*.*.l': [["baz.b.c.l", 13], ["baz.f.d.l", 14]],
      'baz.*.{r, c}.**.q': [["baz.y.r.m.n.q", 10], ["baz.z.c.n.m.q", 12]]
    };

    await Promise.all(Object.entries(thresholdsWithResults)
      .map(async ([thr, expectedResults]) => {
        const results = check(checkedObject, { [thr]: 1 });

        await Promise.all(expectedResults.map(async ([path, value]) => {
          const foundResult = results.find((result) => result.path === path);

          await expect(foundResult).toBeValid(thr, path, value);
        }));

        await expect(results.filter(({ path }) => !expectedResults.some(([expectedPath]) => expectedPath === path))).toEqual([]);
      })
    );
  });

  test('Check pages', async () => {
    const pagesData = {
      foo: {
        a: 1,
        b: -0.5,
        c: -1
      },
      bar: {
        a: -2,
        b: 3,
        c: 4
      }
    };
    const thresholds = {
      'default': {
        a: 1,
        b: 1,
        c: 1
      },
      bar: {
        a: 1,
        c: 3
      }
    };
    const expectedResult = {
      "success": false,
      "results": {
        "foo": {
          "success": true,
          "results": [{
            "path": "a",
            "splitPath": ["a"],
            "threshold": 1,
            "value": 1,
            "difference": 0,
            "status": "partial_worsening"
          }, {
            "path": "b",
            "splitPath": ["b"],
            "threshold": 1,
            "value": -0.5,
            "difference": -1.5,
            "status": "without_changes"
          }, {
            "path": "c",
            "splitPath": ["c"],
            "threshold": 1,
            "value": -1,
            "difference": -2,
            "status": "partial_improvement"
          }]
        },
        "bar": {
          "success": false,
          "results": [{
            "path": "a",
            "splitPath": ["a"],
            "threshold": 1,
            "value": -2,
            "difference": -3,
            "status": "improvement"
          }, {
            "path": "c",
            "splitPath": ["c"],
            "threshold": 3,
            "value": 4,
            "difference": 1,
            "status": "worsening"
          }]
        }
      }
    };

    const result = checkPages(pagesData, thresholds);

    await expect(result).toEqual(expectedResult);
  });
});
