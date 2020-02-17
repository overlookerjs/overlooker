const parallelizeArray = (functionsArray, threads, restartTime = 0, onError) => {
  const functionsArrayCopy = [...functionsArray];
  const completed = [];

  let completedCount = 0;
  let index = 0;
  let isStopped = false;

  const stop = () => isStopped = true;

  const execute = async (asyncFn, insertIndex, threadIndex) => {
    let complete = false;

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
        if (onError) {
          await onError(e);
        }

        await new Promise((res) => setTimeout(res, restartTime));
      }
    }
  };

  const run = async (resolve, threadIndex) => {
    while (functionsArrayCopy.length && !isStopped) {
      const asyncFn = functionsArrayCopy.shift();
      const functionIndex = index++;

      await execute(asyncFn, functionIndex, threadIndex);

      if (completedCount === functionsArray.length) {
        resolve(completed);
      }
    }

    if (isStopped) {
      resolve(completed);
    }
  };

  const promise = new Promise((resolve) => Array(Array.isArray(threads) ? threads.length : threads)
    .fill(null)
    .forEach((c, i) => run(resolve, i))
  );

  return {
    stop,
    then: (cb) => promise.then(cb)
  }
};

const parallelizeObject = (functionsObject, threads, restartTime, onError) => {
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

  const { stop, then } = parallelizeArray(functions, threads, restartTime, onError);

  return {
    stop,
    then: (cb) => then((completed) => completed
      .reduce((acc, result, globalIndex) => {
        const { key, index } = map[globalIndex];

        acc[key][index] = result;

        return acc;
      }, objectPlaceholder))
      .then(cb)
  }
};

module.exports = {
  parallelizeArray,
  parallelizeObject
};
