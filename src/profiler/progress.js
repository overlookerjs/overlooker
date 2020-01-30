const defaultProgressCatcher = async (progress) => console.log(`progress: ${(progress * 100).toFixed(2)}%`);

const getProgressLogger = (catcher = defaultProgressCatcher) => {
  let complete = 0;

  return async (increase) => {
    complete += increase;

    return catcher(complete);
  };
};

module.exports = {
  getProgressLogger
};
