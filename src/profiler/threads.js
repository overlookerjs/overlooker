const parallelizeArray = (functionsArray, threads, onError, restartTime = 5000, retryAttempts = 15) => {
  const functionsArrayCopy = [...functionsArray];
  const completed = [];

  let completedCount = 0;
  let index = 0;
  let isStopped = false;

  const stop = () => isStopped = true;

  const execute = async (asyncFn, insertIndex, threadIndex) => {
    let complete = false;
    let retryCount = retryAttempts;

    while (!complete && !isStopped) {
      try {
        completed[insertIndex] = await (
          Array.isArray(threads) ? (
            threads[threadIndex]((...args) => asyncFn(stop, ...args))
          ) : (
            asyncFn(stop)
          )
        );
        completedCount++;
        complete = true;
      } catch (e) {
        if (retryCount > 0) {
          if (onError) {
            await onError(e);
          }

          retryCount--;

          await new Promise((res) => setTimeout(res, restartTime));
        } else {
          throw new Error('Retry attempts exceed');
        }
      }
    }
  };

  const run = async (resolve, reject, threadIndex) => {
    while (functionsArrayCopy.length && !isStopped) {
      const asyncFn = functionsArrayCopy.shift();
      const functionIndex = index++;

      try {
        await execute(asyncFn, functionIndex, threadIndex);

        if (completedCount === functionsArray.length) {
          resolve(completed);
        }
      } catch (e) {
        reject(e);
        return;
      }
    }

    if (isStopped) {
      resolve(completed);
    }
  };

  const promise = new Promise((resolve, reject) => Array(Array.isArray(threads) ? threads.length : threads)
    .fill(null)
    .forEach((c, i) => run(resolve, reject, i))
  );

  return {
    stop,
    promise
  }
};

const parallelizeObject = (functionsObject, threads, restartTime, retryAttempts, onError) => {
  const keysOrder = Object.keys(functionsObject);
  const objectPlaceholder = keysOrder.reduce((acc, key) => ({ ...acc, [key]: [] }), {});

  const flattedObject = Object.entries(functionsObject)
    .reduce((acc, [key, array]) => acc.concat(array.map((fn, index) => ({ fn, key, index }))), [])
    .sort((a, b) => a.index - b.index || keysOrder.indexOf(a.key) - keysOrder.indexOf(b.key));

  const map = flattedObject.reduce((acc, { key, index }, globalIndex) => ({
    ...acc,
    [globalIndex]: {
      key,
      index
    }
  }), {});
  const functions = flattedObject.map(({ fn }) => fn);

  const { stop, promise } = parallelizeArray(functions, threads, restartTime, retryAttempts, onError);

  return {
    stop,
    promise: promise
      .then((completed) => completed
        .reduce((acc, result, globalIndex) => {
          const { key, index } = map[globalIndex];

          acc[key][index] = result;

          return acc;
        }, objectPlaceholder))
  }
};

module.exports = {
  parallelizeArray,
  parallelizeObject
};
