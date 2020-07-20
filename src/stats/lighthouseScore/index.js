const { scoringGuides } = require( './metrics.js' );
const { arithmeticMean } = require( './util.js' );
const { quantileAtValue } = require( './math.js' );

const getLighthouseScore = (values, platform) => {
  const scoring = scoringGuides.v6[platform];
  const metricsData = Object.keys(scoring).map(id => {
    const metricScoring = scoring[id];

    return {
      id,
      metricScoring,
      value: values[ id ],
      score: Math.round(quantileAtValue(metricScoring, values[id]) * 100),
    };
  } );

  const auditRefs = metricsData.map(metric => {
    return {
      id: metric.id,
      weight: metric.metricScoring.weight,
      group: 'metrics',
      result: {
        score: metric.score / 100,
      },
    };
  } );

  const score = arithmeticMean(auditRefs);

  return score * 100;
}

module.exports = {
  getLighthouseScore
};
