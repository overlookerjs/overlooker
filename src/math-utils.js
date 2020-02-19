const sub = (a, b) => typeof a === 'number' && typeof b === 'number' ? (a || 0) - (b || 0) : null;

const inverseSub = (a, b) => sub(b, a);

const percent = (a, b)  => typeof a === 'number' && typeof b === 'number' ? (a && b ? ((a / b) - 1) : 0) : null;

const inversePercent = (a, b) => percent(b, a);

module.exports = {
  sub,
  inverseSub,
  percent,
  inversePercent
};
