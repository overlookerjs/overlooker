const sub = (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0);

const inverseSub = (a, b) => sub(b, a);

const percent = (a, b)  => typeof a === 'number' && typeof b === 'number' ? (a && b ? ((a / b) - 1) : 0) : null;

const inversePercent = (a, b) => percent(b, a);

module.exports = {
  sub,
  inverseSub,
  percent,
  inversePercent
};
