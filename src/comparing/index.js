const { objSub, objPercent, objMap } = require('../utils.js');
const { compareNetworks } = require('./compare-network.js');
const { compareEvaluating } = require('./compare-evaluating.js');

const compare = (first, second) => ({
  absolute: {
    stats: objMap(second.stats, (innerObj, key) => objSub(innerObj, first.stats[key])),
    network: compareNetworks(first.network, second.network),
    evaluating: compareEvaluating(first.evaluating, second.evaluating)
  },
  percent: {
    stats: objMap(second.stats, (innerObj, key) => objPercent(innerObj, first.stats[key]))
  }
});

module.exports = {
  compare
};
