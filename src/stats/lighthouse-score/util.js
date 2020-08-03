// thx Lighthouse's util.js
function arithmeticMean(items) {
  const results = items
    .filter(item => item.weight > 0)
    .reduce((result, item) => {
      const score = item.result.score;
      const weight = item.weight;
  
      return {
        weight: result.weight + weight,
        sum: result.sum + score * weight,
      };
    }, {weight: 0, sum: 0});

  return results.sum / results.weight || 0;
}

module.exports = {
  arithmeticMean
}