const { scoringGuides } = require( './metrics.js' );
const { arithmeticMean } = require( './util.js' );
const { getLogNormalScore } = require( './math.js' );

const getLighthouseScore = (values, platform) => {
  const scoring = scoringGuides.v8[platform];
  const metricsData = Object.entries(scoring).map(([id, metricScoring]) => {
    return {
      id,
      metricScoring,
      value: values[id],
      score: Math.round(getLogNormalScore(metricScoring, values[id]) * 100),
    };
  });

  const auditRefs = metricsData.map(metric => {
    return {
      id: metric.id,
      weight: metric.metricScoring.weight,
      group: 'metrics',
      result: {
        score: metric.score / 100,
      },
    };
  });

  const score = arithmeticMean(auditRefs);

  return score * 100;
}

module.exports = {
  getLighthouseScore
};
